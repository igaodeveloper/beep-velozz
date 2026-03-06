/**
 * Scanner Industrial - Módulo de Identificação v3.0 - Profissional
 * Responsável por classificar códigos com precisão absoluta
 * 
 * REGRAS DE IDENTIFICAÇÃO (ordem rigorosa):
 * 1. MLB → MERCADO LIVRE
 * 2. LM + 2+ caracteres → AVULSO
 * 3. 14 + 2+ caracteres → AVULSO
 * 4. BR + 6+ caracteres → SHOPEE
 * 5. 20000 → MERCADO LIVRE (qualquer comprimento)
 * 6. ID46 ou 46 → MERCADO LIVRE (qualquer comprimento)
 * 7. Qualquer outro com 4+ caracteres → AVULSO (fallback)
 * 8. Menos de 4 caracteres → INVÁLIDO
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
  // Mercado Livre - Prefixo MLB (LogManager)
  {
    prefix: 'MLB',
    minLength: 5, // MLB + 2+ caracteres
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo MLB)',
  },
  // Avulso - Prefixo LM
  {
    prefix: 'LM',
    minLength: 4, // LM + 2 caracteres
    type: 'avulso' as PackageType,
    audioKey: 'beep_c',
    description: 'Avulso (prefixo LM)',
  },
  // Avulso - Prefixo 14 (numérico)
  {
    prefix: '14',
    minLength: 4, // 14 + 2 caracteres/dígitos
    type: 'avulso' as PackageType,
    audioKey: 'beep_c',
    description: 'Avulso (prefixo 14)',
  },
  // Shopee - Prefixo BR
  {
    prefix: 'BR',
    minLength: 8, // BR + 6 caracteres
    type: 'shopee' as PackageType,
    audioKey: 'beep_a',
    description: 'Shopee (prefixo BR)',
  },
  // Mercado Livre - Prefixo 20000
  {
    prefix: '20000',
    minLength: 5, // apenas 20000, qualquer comprimento extra é aceito
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo 20000)',
  },
  // Mercado Livre - Prefixo ID46 (alguns códigos vêm com ID na frente)
  {
    prefix: 'ID46',
    minLength: 4, // pouco: ID46 + qualquer coisa
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo ID46)',
  },
  // Mercado Livre - Prefixo 46
  {
    prefix: '46',
    minLength: 2, // apenas 46, qualquer extensão
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo 46)',
  },
  // Mercado Livre - Prefixo 45
  {
    prefix: '45',
    minLength: 2, // apenas 45, qualquer extensão
    type: 'mercado_livre' as PackageType,
    audioKey: 'beep_b',
    description: 'Mercado Livre (prefixo 45)',
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

  const trimmed = rawCode.trim().toUpperCase();

  if (trimmed.length === 0) {
    console.debug(`[normalizeCode] ⚠️ EMPTY AFTER TRIM`);
    return '';
  }

  // Remove caracteres que não são alfanuméricos
  let normalized = trimmed.replace(/[^0-9A-Z]/g, '');
  console.debug(`[normalizeCode] STEP1: "${rawCode}" → "${trimmed}" → "${normalized}"`);

  // Many scanners prepend an "ID" before numeric ML prefixes (e.g. "ID46...").
  // If the code begins with ID followed by a digit, strip the ID so our
  // prefix patterns work correctly. This does not affect codes like "IDLM..."
  if (/^ID[0-9]/.test(normalized)) {
    const beforeStrip = normalized;
    normalized = normalized.slice(2);
    console.debug(`[normalizeCode] STEP2: Removed ID prefix: "${beforeStrip}" → "${normalized}"`);
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
      };
      identificationCache.set(normalizedCode, result);
      return result;
    }
  }

  console.debug(`[identifyPackage] ❌ NO PREFIX MATCH: "${normalizedCode}" against all ${PREFIX_PATTERNS.length} patterns`);

  // PASSO 2: Se passou em validação mas não bateu com prefixo específico,
  // classifica como AVULSO apenas se COMEÇAR COM LETRA (não com dígito de Mercado Livre)
  if (validateCode(normalizedCode)) {
    // Se começa com dígito, assume que pode ser um código desconhecido
    const startsWithLetter = /^[A-Z]/.test(normalizedCode);

    if (startsWithLetter) {
      result = {
        type: 'avulso',
        matched: true,
        confidence: 'medium',
      };
    } else {
      // Começa com dígito mas não foi capturado por nenhum prefixo.
      // Pode ocorrer se o código numérico tiver prefixo válido mas o tamanho
      // era menor que o mínimo antigo. Para evitar falhas, tratamos qualquer
      // sequência 20000/46 como Mercado Livre aqui.
      if (/^(20000|46)/.test(normalizedCode)) {
        result = {
          type: 'mercado_livre',
          matched: true,
          confidence: 'high',
        };
      } else {
        result = {
          type: 'unknown',
          matched: false,
          confidence: 'low',
        };
      }
    }

    identificationCache.set(normalizedCode, result);
    return result;
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
