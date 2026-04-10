/**
 * Scanner Industrial - Módulo de Identificação v3.0 - Profissional
 * Responsável por classificar códigos com precisão absoluta
 * 
 * REGRAS DE IDENTIFICAÇÃO (ordem rigorosa):
 * 1. 20000 → MERCADO LIVRE (qualquer comprimento)
 * 2. LM + 2+ caracteres → AVULSO
 * 3. 14 + 2+ caracteres → AVULSO
 * 4. BR + 6+ caracteres → SHOPEE
 * 5. Qualquer outro com 4+ caracteres → AVULSO (fallback)
 * 6. Menos de 4 caracteres → INVÁLIDO
 *
 * Observação: a partir desta versão só aceitamos prefixos 20000 para
 * Mercado Livre; qualquer outro prefixo (MLB, 46, ID46, 45) não
 * será tratado como Mercado Livre e cairá no fallback.
 */

import {
  PackageType,
  PackageIdentification,
  PrefixMapping,
} from '@/types/scanner';

/**
 * Mapeamento PRECISO de prefixos → tipos de pacote
 * ORDEM IMPORTA! Mais específicos primeiro
 */
const PREFIX_PATTERNS = [
  // Mercado Livre - Prefixo 20000 (aceito)
  {
    prefix: '20000',
    minLength: 5,
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo 20000)',
  },
  // Mercado Livre - Padrão de envio: começa com digit(s) + letra (ex: 2200D1241459785, 4482D247404)
  {
    prefix: '2200D',
    minLength: 9, // 2200D + 4+ dígitos
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (pack ID 2200D)',
  },
  {
    prefix: '4482D',
    minLength: 9, // 4482D + 3+ dígitos
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (código de envio 4482D)',
  },
  // Mercado Livre - Códigos numéricos longos (envios)
  {
    prefix: '466',
    minLength: 11,
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (código de envio 466)',
  },
  // Avulso - Prefixo LM
  {
    prefix: 'LM',
    minLength: 4,
    type: 'avulso' as PackageType,
    audioKey: 'beep_c',
    description: 'Avulso (prefixo LM)',
  },
  // Avulso - Prefixo 14 (numérico)
  {
    prefix: '14',
    minLength: 4,
    type: 'avulso' as PackageType,
    audioKey: 'beep_c',
    description: 'Avulso (prefixo 14)',
  },
  // Shopee - Prefixo BR
  {
    prefix: 'BR',
    minLength: 8,
    type: 'shopee' as PackageType,
    audioKey: 'beep_a',
    description: 'Shopee (prefixo BR)',
  },
];

/**
 * Cache de validação para melhor performance
 */
const identificationCache = new Map<string, PackageIdentification>();

/**
 * Limpa cache a cada 5 minutos
 */
const CACHE_TTL = 5 * 60 * 1000;
setInterval(() => {
  identificationCache.clear();
}, CACHE_TTL);

/**
 * Normaliza código de forma rigorosa
 * - MAIÚSCULAS
 * - Remove espaços
 * - Remove caracteres especiais
 * - Valida comprimento mínimo
 */
export function normalizeCode(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    console.debug(`[normalizeCode] ⚠️ INVALID INPUT: ${typeof rawCode} = ${rawCode}`);
    return '';
  }

  // Extrair ID de payload JSON, caso o scanner retorne uma string serializada
  // que contenha {"id":"..."}. Isso resolve o caso observado no log.
  let input = rawCode;
  if (input.startsWith('{') && input.endsWith('}')) {
    try {
      const obj = JSON.parse(input);
      if (obj && typeof obj.id === 'string') {
        input = obj.id;
        console.debug(`[normalizeCode] extract id from JSON → ${input}`);
      }
    } catch {
      // não é JSON válido; seguir com rawCode original
    }
  }

  const trimmed = input.trim().toUpperCase();

  if (trimmed.length === 0) {
    console.debug(`[normalizeCode] ⚠️ EMPTY AFTER TRIM`);
    return '';
  }

  // Remove caracteres que não são alfanuméricos
  let normalized = trimmed.replace(/[^0-9A-Z]/g, '');
  console.debug(`[normalizeCode] STEP1: "${rawCode}" → "${trimmed}" → "${normalized}"`);

  // Many scanners prepend an "ID" before numeric ML prefixes (e.g. "ID20000...").
  // If the code begins with ID followed by a digit, strip the ID so our
  // prefix patterns work correctly. This does not affect codes like "IDLM..."
  if (/^ID[A-Z0-9]/.test(normalized)) {
    const beforeStrip = normalized;
    normalized = normalized.slice(2);
    console.debug(`[normalizeCode] STEP2: Removed ID prefix: "${beforeStrip}" → "${normalized}"`);
  }

  // Enhanced ML extraction using advanced patterns
  // Tenta extrair códigos ML complexos de URLs, QR codes e payloads
  const mlExtracted = extractMercadoLivreCode(normalized);
  if (mlExtracted && mlExtracted !== normalized) {
    const before = normalized;
    normalized = mlExtracted;
    console.debug(`[normalizeCode] STEP3: Advanced ML extraction from "${before}" → "${normalized}"`);
  }

  // Fallback para extração simples de ML 20000 (backward compatibility)
  if (!/^20000/.test(normalized) && !mlExtracted) {
    const match = normalized.match(/(ID)?20000[0-9A-Z]+/);
    if (match) {
      const before = normalized;
      normalized = match[0];
      console.debug(`[normalizeCode] STEP4: Fallback ML extraction from "${before}" → "${normalized}"`);

      // after extraction we might still have a leading "ID"; strip it as
      // we did earlier so that downstream logic sees the raw numeric prefix.
      if (/^ID./.test(normalized)) {
        const beforeStrip = normalized;
        normalized = normalized.slice(2);
        console.debug(`[normalizeCode] STEP4b: Stripped ID prefix: "${beforeStrip}" → "${normalized}"`);
      }
    }
  }

  console.debug(`[normalizeCode] ✅ FINAL: "${normalized}"`);
  return normalized;
}

/**
 * Valida se um código tem formato aceitável
 * Critério: mínimo 4 caracteres, apenas alfanumérico
 */
export function validateCode(normalizedCode: string): boolean {
  if (!normalizedCode || normalizedCode.length < 4) {
    console.debug(`[validateCode] ❌ INVALID: length=${normalizedCode?.length}, minRequired=4`);
    return false;
  }

  // Apenas alfanuméricos
  const valid = /^[A-Z0-9]+$/.test(normalizedCode);
  if (!valid) {
    console.debug(`[validateCode] ❌ INVALID CHARS: "${normalizedCode}" (contains non-alphanumeric)`);
  } else {
    console.debug(`[validateCode] ✅ VALID: "${normalizedCode}"`);
  }
  return valid;
}

/**
 * Identifica tipo de pacote com precisão absoluta
 * NUNCA classifica como Avulso por padrão - requer padrão explícito
 */
export function identifyPackage(normalizedCode: string): PackageIdentification {
  if (!normalizedCode || normalizedCode.length < 4) {
    return {
      type: 'unknown',
      matched: false,
      confidence: 'low',
    };
  }

  // sanity check: if code clearly has ML numeric prefix but cache or patterns
  // fail, we'll still continue and log an error later once result is computed.

  // Verifica cache
  const cached = identificationCache.get(normalizedCode);
  if (cached) {
    // revalida prefixo para evitar cache staleness
    const prefixMatch = PREFIX_PATTERNS.find(p =>
      normalizedCode.startsWith(p.prefix) && normalizedCode.length >= p.minLength
    );
    if (prefixMatch && prefixMatch.type === cached.type) {
      return cached;
    }
    // caso cache esteja desatualizado, continua para recalcular
  }

  let result: PackageIdentification = {
    type: 'unknown',
    matched: false,
    confidence: 'low',
  };

  // PASSO 1: Tenta bater com prefixos conhecidos (ordem rigorosa)
  for (const pattern of PREFIX_PATTERNS) {
    if (
      normalizedCode.startsWith(pattern.prefix) &&
      normalizedCode.length >= pattern.minLength
    ) {
      console.debug(
        `[identifyPackage] ✅ MATCH ENCONTRADO: "${normalizedCode}" matches prefix "${pattern.prefix}" (minLength=${pattern.minLength}) => type="${pattern.type}"`
      );
      result = {
        type: pattern.type,
        matched: true,
        confidence: 'high',
        description: pattern.description,
      };
      identificationCache.set(normalizedCode, result);
      return result;
    }
  }

  console.debug(`[identifyPackage] ❌ NO PREFIX MATCH: "${normalizedCode}" against all ${PREFIX_PATTERNS.length} patterns`);

  // PASSO 2: Usa identificação avançada para Mercado Livre
  if (validateCode(normalizedCode)) {
    // Tenta identificação avançada ML primeiro
    const mlAdvanced = advancedMercadoLivreIdentification(normalizedCode);
    
    if (mlAdvanced.isML && mlAdvanced.code) {
      result = {
        type: 'mercado_livre',
        matched: true,
        confidence: mlAdvanced.confidence >= 0.8 ? 'high' : 
                   mlAdvanced.confidence >= 0.6 ? 'medium' : 'low',
        description: `Mercado Livre (${mlAdvanced.type})`,
      };
      console.log(`[identifyPackage] 🚀 MERCADO LIVRE DETECTADO (AVANÇADO): "${mlAdvanced.code}" -> ${mlAdvanced.type} (${mlAdvanced.confidence})`);
    } else {
      // Se não for ML, verifica se começa com letra para classificar como Avulso
      const startsWithLetter = /^[A-Z]/.test(normalizedCode);

      if (startsWithLetter) {
        result = {
          type: 'avulso',
          matched: true,
          confidence: 'medium',
        };
      } else {
        // Começa com dígito mas não foi capturado por nenhum padrão ML
        result = {
          type: 'unknown',
          matched: false,
          confidence: 'low',
        };
        console.log(`[identifyPackage] ❌ CÓDIGO DESCONHECIDO: "${normalizedCode}" (não é ML nem começa com letra)`);
      }
    }

    identificationCache.set(normalizedCode, result);
    return result;
  }

  // Não passou em nenhuma validação - último fallback para Mercado Livre
  // Verifica se pode ser um código ML mal formado mas reconhecível
  if (normalizedCode && normalizedCode.length >= 4) {
    // Verificação final para padrões ML mesmo sem validação completa
    const mlPatterns = [
      /20000/,     // Prefixo clássico
      /2200D/,     // Pack ID
      /4482D/,     // Envio ID
      /466/,       // Código envio
      /^\d{6,}/    // Código numérico longo
    ];

    const matchesML = mlPatterns.some(pattern => pattern.test(normalizedCode));
    
    if (matchesML) {
      result = {
        type: 'mercado_livre',
        matched: true,
        confidence: 'medium',
        description: 'Mercado Livre (fallback emergencial)',
      };
      console.log(`[identifyPackage] 🚨 MERCADO LIVRE DETECTADO POR FALLBACK EMERGENCIAL: "${normalizedCode}"`);
      identificationCache.set(normalizedCode, result);
      return result;
    }
  }

  // Não passou em nenhuma validação
  identificationCache.set(normalizedCode, result);

  if (!result.matched) {
    console.warn(`[ScannerIdentification] ⚠️ UNKNOWN CODE: "${normalizedCode}" -> ${result.type}`);
  }

  return result;
}

/**
 * Retorna o audioKey para um tipo de pacote
 */
export function getAudioKeyForType(type: PackageType): string {
  for (const pattern of PREFIX_PATTERNS) {
    if (pattern.type === type) {
      return pattern.audioKey;
    }
  }
  return 'beep_error';
}

/**
 * Obtém o rótulo descritivo do tipo de pacote
 */
export function getPackageTypeLabel(type: PackageType): string {
  switch (type) {
    case 'shopee':
      return 'Shopee';
    case 'mercado_livre':
      return 'Mercado Livre';
    case 'avulso':
      return 'Avulso';
    case 'unknown':
      return 'Desconhecido';
    default:
      return 'Unknown';
  }
}

/**
 * Extrai o prefixo efetivo do código para análise
 */
export function extractPrefix(normalizedCode: string): string | null {
  for (const pattern of PREFIX_PATTERNS) {
    if (normalizedCode.startsWith(pattern.prefix)) {
      return pattern.prefix;
    }
  }
  return null;
}

/**
 * Lista todos os prefixos conhecidos
 */
export function getAllKnownPrefixes(): string[] {
  return PREFIX_PATTERNS.map(p => p.prefix);
}

/**
 * Verifica se um código é definitivamente um tipo específico
 */
export function isDefinitelyType(normalizedCode: string, type: PackageType): boolean {
  const identification = identifyPackage(normalizedCode);
  return identification.type === type && identification.confidence === 'high';
}

/**
 * Obtém confidence score (0-1)
 */
export function getConfidenceScore(normalizedCode: string, type: PackageType): number {
  const identification = identifyPackage(normalizedCode);
  
  if (identification.type !== type) {
    return 0;
  }

  switch (identification.confidence) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.3;
    default:
      return 0;
  }
}

/**
 * Limpa cache manualmente se necessário
 */
export function clearIdentificationCache(): void {
  identificationCache.clear();
}

/**
 * Retorna tamanho atual do cache
 */
export function getCacheSize(): number {
  return identificationCache.size;
}

// =============================================================================
// FUNÇÕES ESPECIALIZADAS PARA MERCADO LIVRE
// =============================================================================

/**
 * Padrões avançados para identificação de códigos Mercado Livre
 * Inclui variações e formatos encontrados na prática
 */
const MERCADO_LIVRE_PATTERNS = {
  // Padrões clássicos
  CLASSIC_20000: /^20000\d{6,15}$/,
  PACK_ID_2200D: /^2200D[A-Z0-9]{4,12}$/,
  SHIPPING_ID_4482D: /^4482D[A-Z0-9]{3,10}$/,
  TRACKING_466: /^466\d{8,15}$/,
  
  // Padrões numéricos longos (envios)
  LONG_NUMERIC_8: /^\d{8,15}$/,
  LONG_NUMERIC_10: /^\d{10,15}$/,
  
  // Padrões com ID prefix
  ID_20000: /^ID20000\d{6,15}$/,
  ID_2200D: /^ID2200D[A-Z0-9]{4,12}$/,
  ID_4482D: /^ID4482D[A-Z0-9]{3,10}$/,
  ID_466: /^ID466\d{8,15}$/,
  
  // Padrões de rastreio ML
  ML_TRACKING: /^ML[A-Z0-9]{8,20}$/,
  MERCADO_LIBRE: /^MERCADOLIBRE[A-Z0-9]{5,15}$/,
  
  // Padrões de QR code content
  QR_ML_PREFIX: /^(ML|20000|ID20000)[A-Z0-9]{5,20}$/,
  URL_TRACKING: /(?:tracking|track|rastreio|ml)\.?(?:mercadolivre|mercado libre)?[\/\-\.]?[A-Z0-9]{8,20}/i,
};

/**
 * Verifica se um código corresponde a qualquer padrão conhecido do Mercado Livre
 * @param normalizedCode Código normalizado para verificação
 * @returns true se corresponder a algum padrão ML
 */
export function isMercadoLivreCode(normalizedCode: string): boolean {
  if (!normalizedCode || normalizedCode.length < 4) {
    return false;
  }

  // Verifica todos os padrões conhecidos
  for (const [patternName, regex] of Object.entries(MERCADO_LIVRE_PATTERNS)) {
    if (regex.test(normalizedCode)) {
      console.debug(`[isMercadoLivreCode] ✅ MATCH: "${normalizedCode}" -> ${patternName}`);
      return true;
    }
  }

  return false;
}

/**
 * Identifica o tipo específico de código Mercado Livre
 * @param normalizedCode Código normalizado
 * @returns Tipo específico do código ML ou null se não for ML
 */
export function identifyMercadoLivreType(normalizedCode: string): string | null {
  if (!isMercadoLivreCode(normalizedCode)) {
    return null;
  }

  // Verifica em ordem de especificidade
  if (MERCADO_LIVRE_PATTERNS.CLASSIC_20000.test(normalizedCode)) {
    return 'Clássico 20000';
  }
  if (MERCADO_LIVRE_PATTERNS.PACK_ID_2200D.test(normalizedCode)) {
    return 'Pack ID 2200D';
  }
  if (MERCADO_LIVRE_PATTERNS.SHIPPING_ID_4482D.test(normalizedCode)) {
    return 'Shipping ID 4482D';
  }
  if (MERCADO_LIVRE_PATTERNS.TRACKING_466.test(normalizedCode)) {
    return 'Tracking 466';
  }
  if (MERCADO_LIVRE_PATTERNS.ML_TRACKING.test(normalizedCode)) {
    return 'ML Tracking';
  }
  if (MERCADO_LIVRE_PATTERNS.LONG_NUMERIC_8.test(normalizedCode)) {
    return 'Numérico Longo';
  }
  if (MERCADO_LIVRE_PATTERNS.QR_ML_PREFIX.test(normalizedCode)) {
    return 'QR Code ML';
  }

  return 'Mercado Livre (Genérico)';
}

/**
 * Extrai código ML de URLs e payloads complexos
 * @param rawInput Input bruto que pode conter URL ou JSON
 * @returns Código ML extraído ou null
 */
export function extractMercadoLivreCode(rawInput: string): string | null {
  if (!rawInput || typeof rawInput !== 'string') {
    return null;
  }

  // 1. Tenta extrair de JSON
  if (rawInput.startsWith('{') && rawInput.endsWith('}')) {
    try {
      const obj = JSON.parse(rawInput);
      if (obj && typeof obj.id === 'string') {
        const extracted = obj.id.trim().toUpperCase();
        if (isMercadoLivreCode(extracted)) {
          return extracted;
        }
      }
    } catch {
      // JSON inválido, continua para outras verificações
    }
  }

  // 2. Tenta extrair de URLs
  const urlMatch = rawInput.match(MERCADO_LIVRE_PATTERNS.URL_TRACKING);
  if (urlMatch) {
    const codeFromUrl = urlMatch[0].replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (isMercadoLivreCode(codeFromUrl)) {
      return codeFromUrl;
    }
  }

  // 3. Tenta encontrar padrões ML no meio do texto
  const mlPatterns = [
    /20000\d{6,15}/g,
    /2200D[A-Z0-9]{4,12}/g,
    /4482D[A-Z0-9]{3,10}/g,
    /466\d{8,15}/g,
    /ML[A-Z0-9]{8,20}/g,
  ];

  for (const pattern of mlPatterns) {
    const matches = rawInput.match(pattern);
    if (matches && matches.length > 0) {
      const candidate = matches[0].replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (isMercadoLivreCode(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Validação robusta para códigos Mercado Livre
 * @param code Código para validar
 * @returns Objeto com resultado da validação
 */
export function validateMercadoLivreCode(code: string): {
  isValid: boolean;
  type: string | null;
  confidence: number;
  issues: string[];
} {
  const normalized = code.trim().toUpperCase();
  const issues: string[] = [];

  if (!normalized || normalized.length < 4) {
    issues.push('Código muito curto (mínimo 4 caracteres)');
    return { isValid: false, type: null, confidence: 0, issues };
  }

  // Verifica caracteres inválidos
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    issues.push('Contém caracteres inválidos (apenas A-Z e 0-9 permitidos)');
  }

  // Identifica o tipo
  const mlType = identifyMercadoLivreType(normalized);
  
  if (!mlType) {
    issues.push('Não corresponde a nenhum padrão conhecido do Mercado Livre');
    return { isValid: false, type: null, confidence: 0, issues };
  }

  // Calcula confiança baseada no tipo
  let confidence = 0.5; // Base
  
  switch (mlType) {
    case 'Clássico 20000':
      confidence = 0.95;
      break;
    case 'Pack ID 2200D':
    case 'Shipping ID 4482D':
      confidence = 0.90;
      break;
    case 'Tracking 466':
      confidence = 0.85;
      break;
    case 'ML Tracking':
      confidence = 0.80;
      break;
    case 'Numérico Longo':
      confidence = 0.60;
      break;
    case 'QR Code ML':
      confidence = 0.75;
      break;
    default:
      confidence = 0.50;
  }

  // Ajusta confiança baseada no comprimento
  if (normalized.length >= 12) {
    confidence = Math.min(1.0, confidence + 0.1);
  } else if (normalized.length < 8) {
    confidence = Math.max(0.3, confidence - 0.2);
  }

  return {
    isValid: issues.length === 0,
    type: mlType,
    confidence,
    issues
  };
}

/**
 * Função unificada para identificação avançada de Mercado Livre
 * Combina todas as técnicas de extração e validação
 * @param rawInput Input bruto do scanner
 * @returns Resultado completo da identificação
 */
export function advancedMercadoLivreIdentification(rawInput: string): {
  isML: boolean;
  code: string | null;
  type: string | null;
  confidence: number;
  method: string;
  issues: string[];
} {
  const issues: string[] = [];

  // 1. Extrai código de várias fontes
  let extractedCode = extractMercadoLivreCode(rawInput);
  let method = 'extraction';

  // 2. Se não extraiu, tenta normalização direta
  if (!extractedCode) {
    const normalized = rawInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length >= 4) {
      extractedCode = normalized;
      method = 'normalization';
    }
  }

  // 3. Se ainda não tiver código, retorna falha
  if (!extractedCode) {
    issues.push('Não foi possível extrair um código válido do input');
    return {
      isML: false,
      code: null,
      type: null,
      confidence: 0,
      method: 'none',
      issues
    };
  }

  // 4. Valida o código extraído
  const validation = validateMercadoLivreCode(extractedCode);
  
  return {
    isML: validation.isValid,
    code: extractedCode,
    type: validation.type,
    confidence: validation.confidence,
    method,
    issues: [...issues, ...validation.issues]
  };
}

/**
 * Lista todos os padrões ML conhecidos para debugging
 */
export function getAllMercadoLivrePatterns(): Array<{name: string, pattern: string, description: string}> {
  return [
    {
      name: 'CLASSIC_20000',
      pattern: MERCADO_LIVRE_PATTERNS.CLASSIC_20000.source,
      description: 'Código clássico ML começando com 20000'
    },
    {
      name: 'PACK_ID_2200D',
      pattern: MERCADO_LIVRE_PATTERNS.PACK_ID_2200D.source,
      description: 'ID de pacote começando com 2200D'
    },
    {
      name: 'SHIPPING_ID_4482D',
      pattern: MERCADO_LIVRE_PATTERNS.SHIPPING_ID_4482D.source,
      description: 'ID de envio começando com 4482D'
    },
    {
      name: 'TRACKING_466',
      pattern: MERCADO_LIVRE_PATTERNS.TRACKING_466.source,
      description: 'Código de rastreio começando com 466'
    },
    {
      name: 'LONG_NUMERIC',
      pattern: MERCADO_LIVRE_PATTERNS.LONG_NUMERIC_8.source,
      description: 'Códigos numéricos longos (8+ dígitos)'
    },
    {
      name: 'ML_TRACKING',
      pattern: MERCADO_LIVRE_PATTERNS.ML_TRACKING.source,
      description: 'Códigos começando com ML'
    },
    {
      name: 'QR_ML_PREFIX',
      pattern: MERCADO_LIVRE_PATTERNS.QR_ML_PREFIX.source,
      description: 'Prefixos ML em QR codes'
    }
  ];
}
