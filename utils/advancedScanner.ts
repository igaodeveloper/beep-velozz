/**
 * Advanced Scanner Engine v3.0
 * Motor avançado de detecção com:
 * - Validação de checksum (EAN-13, UPC-A, módulo 10)
 * - Detecção de padrões múltiplos
 * - Análise de confiança contextual
 * - Detecção de anomalias
 * - Logging estruturado para auditoria
 * - Suporte a múltiplas plataformas
 */

export type ConfidenceLevel = 'critical' | 'high' | 'medium' | 'low' | 'rejected';

export interface CodePattern {
  name: string; // ex: 'Shopee BR', 'Mercado Livre 20000', etc
  regex: RegExp;
  minLength: number;
  maxLength?: number;
  checksumValidator?: (code: string) => boolean;
  marketplace: string;
  type: 'shopee' | 'mercado_livre' | 'avulso' | 'unknown';
  priority: number;
}

export interface AdvancedScanAnalysis {
  code: string;
  normalized: string;
  type: 'shopee' | 'mercado_livre' | 'avulso' | 'unknown';
  confidence: ConfidenceLevel;
  confidence_score: number; // 0-100
  matched_pattern?: string;
  checksum_valid?: boolean;
  is_suspicious: boolean;
  anomaly_flags: string[];
  marketplace?: string;
  raw_analysis: {
    length: number;
    has_only_alphanumeric: boolean;
    prefix: string | null;
    contains_special_chars: boolean;
    looks_like_barcode: boolean;
    matches_multiple_patterns: number;
  };
}

/**
 * Validadores de checksum para diferentes formatos
 */
const ChecksumValidators = {
  /**
   * Valida EAN-13 (13 dígitos com dígito verificador)
   * Usado por Mercado Livre, Shopee no Brasil
   */
  validateEAN13(code: string): boolean {
    if (!/^\d{13}$/.test(code)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[12]);
  },

  /**
   * Valida UPC-A (12 dígitos com dígito verificador)
   */
  validateUPCA(code: string): boolean {
    if (!/^\d{12}$/.test(code)) return false;
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[11]);
  },

  /**
   * Validação Módulo 10 genérica (Shopee BR)
   */
  validateMod10(code: string): boolean {
    if (!/^BR\d+$/.test(code)) return false;
    const digits = code.substring(2);
    let sum = 0;
    let multiplier = 2;

    for (let i = digits.length - 1; i >= 0; i--) {
      let product = parseInt(digits[i]) * multiplier;
      if (product > 9) product -= 9;
      sum += product;
      multiplier = multiplier === 2 ? 1 : 2;
    }

    return sum % 10 === 0;
  },
};

/**
 * Padrões de código avançados com validação de integridade
 */
const ADVANCED_PATTERNS: CodePattern[] = [
  // AVULSO - Prioridade extremamente alta
  {
    name: 'Avulso LM',
    regex: /^LM[0-9A-Z]{2,}$/,
    minLength: 4,
    maxLength: 20,
    marketplace: 'Custom',
    type: 'avulso',
    priority: 100,
  },

  // SHOPEE - Padrões múltiplos com validação
  {
    name: 'Shopee BR Standard',
    regex: /^BR[0-9A-Z]{6,}$/,
    minLength: 8,
    maxLength: 20,
    checksumValidator: code => ChecksumValidators.validateMod10(code),
    marketplace: 'Shopee',
    type: 'shopee',
    priority: 90,
  },
  {
    name: 'Shopee EAN-13',
    regex: /^[0-9]{13}$/,
    minLength: 13,
    maxLength: 13,
    checksumValidator: code => ChecksumValidators.validateEAN13(code),
    marketplace: 'Shopee',
    type: 'shopee',
    priority: 80,
  },

  // MERCADO LIVRE - Prefixo 20000
  {
    name: 'Mercado Livre 20000',
    regex: /^20000[0-9]*$/,
    minLength: 5,
    maxLength: 20,
    marketplace: 'Mercado Livre',
    type: 'mercado_livre',
    priority: 85,
  },
  // MERCADO LIVRE - Códigos de envio 466
  {
    name: 'Mercado Livre Envio 466',
    regex: /^466[0-9]{8,}$/,
    minLength: 11,
    maxLength: 20,
    marketplace: 'Mercado Livre',
    type: 'mercado_livre',
    priority: 80,
  },

  // Fallback genérico (mantém para outros usos, mas não será aplicado como ML)
  {
    name: 'Generic Alphanumeric',
    regex: /^[A-Z0-9]{4,}$/,
    minLength: 4,
    maxLength: 50,
    marketplace: 'Unknown',
    type: 'avulso',
    priority: 10,
  },
];

/**
 * Normaliza código com extração precisa
 */
export function advancedNormalizeCode(rawCode: string): string {
  console.debug(`[advancedNormalizeCode] Input: "${rawCode}"`);
  if (!rawCode || typeof rawCode !== 'string') return '';

  // extract id from JSON payload if present
  let input = rawCode;
  if (input.startsWith('{') && input.endsWith('}')) {
    try {
      const obj = JSON.parse(input);
      if (obj && typeof obj.id === 'string') {
        input = obj.id;
        console.debug(`[advancedNormalizeCode] extracted id from JSON: "${input}"`);
      }
    } catch {
      // ignore invalid JSON
    }
  }

  const trimmed = input.trim().toUpperCase();
  if (trimmed.length === 0) return '';

  // Remove espaços extras e caracteres de controle
  let cleaned = trimmed.replace(/[\s\0\t\r\n]/g, '');
  console.debug(`[advancedNormalizeCode] Cleaned: "${cleaned}"`);

  // if the cleaned string doesn't start with a ML prefix, try to pull the
  // first matching fragment out of the middle (useful for QR URLs or other
  // payloads where the code is embedded).
  if (!/^20000/.test(cleaned)) {
    const mlMatch = cleaned.match(/(ID)?20000[0-9A-Z]+/);
    if (mlMatch) {
      const before = cleaned;
      cleaned = mlMatch[0];
      console.debug(`[advancedNormalizeCode] Extracted ML fragment from "${before}" → "${cleaned}"`);

      if (/^ID./.test(cleaned)) {
        const beforeStrip = cleaned;
        cleaned = cleaned.slice(2);
        console.debug(`[advancedNormalizeCode] Stripped ID prefix after extraction: "${beforeStrip}" → "${cleaned}"`);
      }
    }
  }

  // Tenta extrair padrões conhecidos em ordem de prioridade
  for (const pattern of ADVANCED_PATTERNS) {
    const extracted = cleaned.match(pattern.regex)?.[0];
    if (extracted) {
      console.debug(`[advancedNormalizeCode] Matched pattern "${pattern.name}": "${extracted}"`);
      return extracted;
    }
  }

  console.debug(`[advancedNormalizeCode] No pattern matched, returning cleaned: "${cleaned}"`);
  return cleaned;
}

/**
 * Functions specialized for Mercado Livre packages. Accepts codes that start with
 * 20000 (Pack IDs) or 466 followed by 8+ digits (shipping codes). This isolates
 * Mercado Livre scanning from the more general engine and prevents accidental
 * acceptance of arbitrary EAN‑13 numbers.
 */

export function normalizeMercadoLivreCode(rawCode: string): string {
  console.debug(`[normalizeMercadoLivreCode] Input: "${rawCode}"`);
  const normalized = advancedNormalizeCode(rawCode);
  console.debug(`[normalizeMercadoLivreCode] Advanced normalized: "${normalized}"`);
  if (/^20000/.test(normalized) || /^466\d{8,}$/.test(normalized)) {
    console.debug(`[normalizeMercadoLivreCode] Accepted prefix: "${normalized}"`);
    return normalized;
  }
  console.debug(`[normalizeMercadoLivreCode] Rejected: no valid prefix in "${normalized}"`);
  // Empty string signals invalid Mercadolivre format
  return '';
}

export function analyzeMercadoLivreCode(rawCode: string): AdvancedScanAnalysis {
  console.debug(`[analyzeMercadoLivreCode] Input: "${rawCode}"`);
  const normalized = normalizeMercadoLivreCode(rawCode);
  console.debug(`[analyzeMercadoLivreCode] Normalized: "${normalized}"`);
  const raw_analysis = {
    length: normalized.length,
    has_only_alphanumeric: /^[A-Z0-9]+$/.test(normalized),
    prefix: extractCodePrefix(normalized),
    contains_special_chars: /[^A-Z0-9]/.test(normalized),
    looks_like_barcode: /^[0-9]{8,14}$/.test(normalized),
    matches_multiple_patterns: 0,
  };

  if (!normalized) {
    console.debug(`[analyzeMercadoLivreCode] Rejected: empty normalized`);
    return {
      code: rawCode,
      normalized,
      type: 'unknown',
      confidence: 'rejected',
      confidence_score: 0,
      is_suspicious: true,
      anomaly_flags: ['prefix_invalido_mercadolivre'],
      raw_analysis,
    };
  }

  console.debug(`[analyzeMercadoLivreCode] Accepted: "${normalized}"`);
  // Continue with analysis...

  // Use the generic analysis but require marketplace to be Mercado Livre
  const result = analyzeCodeAdvanced(normalized);
  if (result.type !== 'mercado_livre') {
    result.anomaly_flags.push('não_é_mercado_livre');
    result.is_suspicious = true;
    result.confidence = 'low';
    result.confidence_score = Math.min(result.confidence_score, 20);
  }

  return result;
}

/**
 * Análise avançada completa de um código
 */
export function analyzeCodeAdvanced(rawCode: string): AdvancedScanAnalysis {
  const normalized = advancedNormalizeCode(rawCode);
  const anomaly_flags: string[] = [];
  let confidence_score = 0;
  let confidence: ConfidenceLevel = 'rejected';
  let matched_pattern: CodePattern | undefined;
  let is_suspicious = false;

  // Análise Raw
  const raw_analysis = {
    length: normalized.length,
    has_only_alphanumeric: /^[A-Z0-9]+$/.test(normalized),
    prefix: extractCodePrefix(normalized),
    contains_special_chars: /[^A-Z0-9]/.test(normalized),
    looks_like_barcode: /^[0-9]{8,14}$/.test(normalized),
    matches_multiple_patterns: 0,
  };

  // Validações iniciais
  if (normalized.length === 0) {
    anomaly_flags.push('código_vazio');
    return {
      code: rawCode,
      normalized,
      type: 'unknown',
      confidence: 'rejected',
      confidence_score: 0,
      is_suspicious: true,
      anomaly_flags,
      raw_analysis,
    };
  }

  if (!raw_analysis.has_only_alphanumeric) {
    anomaly_flags.push('contém_caracteres_especiais_não_normalizados');
    is_suspicious = true;
  }

  // Ordena padrões por prioridade e testa
  const sorted = [...ADVANCED_PATTERNS].sort((a, b) => b.priority - a.priority);
  let matchedPatterns = 0;

  for (const pattern of sorted) {
    if (normalized.length < pattern.minLength) continue;
    if (pattern.maxLength && normalized.length > pattern.maxLength) continue;

    if (pattern.regex.test(normalized)) {
      matchedPatterns++;
      raw_analysis.matches_multiple_patterns = matchedPatterns;

      // Se não temos padrão ainda, ou este tem prioridade maior
      if (!matched_pattern || pattern.priority > matched_pattern.priority) {
        matched_pattern = pattern;

        // Valida checksum se disponível
        let checksum_valid: boolean | undefined;
        if (pattern.checksumValidator) {
          checksum_valid = pattern.checksumValidator(normalized);
          if (!checksum_valid) {
            anomaly_flags.push('checksum_inválido');
            is_suspicious = true;
          }
        }

        // Calcula confiança baseado em padrão e checksum
        if (pattern.priority >= 90) {
          if (checksum_valid === false) {
            confidence = 'low';
            confidence_score = 30;
          } else if (checksum_valid === true) {
            confidence = 'critical';
            confidence_score = 100;
          } else {
            confidence = 'high';
            confidence_score = 85;
          }
        } else if (pattern.priority >= 75) {
          confidence = checksum_valid === false ? 'medium' : 'high';
          confidence_score = checksum_valid === false ? 50 : 80;
        } else {
          confidence = 'medium';
          confidence_score = 60;
        }
      }
    }
  }

  // Se múltiplos padrões coincidem, pode ser ambíguo
  if (matchedPatterns > 1) {
    anomaly_flags.push('ambigüidade_padrão');
    confidence = 'medium';
    confidence_score = Math.max(50, confidence_score - 20);
  }

  // Se nenhum padrão, rejeita
  if (!matched_pattern) {
    anomaly_flags.push('nenhum_padrão_conhecido');
    is_suspicious = true;
  }

  return {
    code: rawCode,
    normalized,
    type: matched_pattern?.type || 'unknown',
    confidence,
    confidence_score,
    matched_pattern: matched_pattern?.name,
    is_suspicious,
    anomaly_flags,
    marketplace: matched_pattern?.marketplace,
    raw_analysis,
  };
}

/**
 * Extrai prefixo (primeira parte significativa)
 */
function extractCodePrefix(code: string): string | null {
  for (const pattern of ADVANCED_PATTERNS) {
    const match = code.match(/^([A-Z]{1,4})/);
    if (match && pattern.regex.test(code)) {
      return match[1];
    }
  }

  // Se for número puro, retorna primeiros dígitos
  if (/^\d+$/.test(code) && code.length >= 2) {
    return code.substring(0, Math.min(5, code.length));
  }

  return null;
}

/**
 * Detecta anomalias baseado em padrão histórico
 * (Contexto: foi usado para o mesmo motorista? Frequência?)
 */
export function detectAnomalies(
  analysis: AdvancedScanAnalysis,
  context?: {
    expectedType?: 'shopee' | 'mercado_livre' | 'avulso';
    recentCodes?: string[];
    driverId?: string;
  }
): AdvancedScanAnalysis {
  if (!context) return analysis;

  // Se um tipo era esperado mas foi detected outro
  if (context.expectedType && analysis.type !== context.expectedType && analysis.type !== 'unknown') {
    analysis.anomaly_flags.push(`tipo_inesperado_esperava_${context.expectedType}`);
    analysis.confidence_score = Math.max(30, analysis.confidence_score - 30);
    analysis.is_suspicious = true;
  }

  // Se código foi visto recentemente (possível refil acidental)
  if (context.recentCodes && context.recentCodes.includes(analysis.normalized)) {
    analysis.anomaly_flags.push('escanneado_recentemente');
    analysis.is_suspicious = true;
  }

  return analysis;
}
