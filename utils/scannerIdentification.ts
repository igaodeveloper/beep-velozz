/**
 * Scanner Industrial - Módulo de Identificação v2.0
 * Responsável por classificar códigos com base em prefixos
 * Escalável, robusto e com validação avançada
 */

import {
  PackageType,
  PackageIdentification,
  PrefixMapping,
} from '@/types/scanner';

/**
 * Padrões regex mais robustos para cada tipo
 * Segue rigorosamente: LM/avulso primeiro, depois Shopee, depois Mercado Livre
 */
const PATTERN_CONFIGS = {
  avulso: {
    patterns: [
      { regex: /^LM[0-9A-Z]{2,}$/, minLength: 4, priority: 1 },
    ],
    description: 'Avulso (LM ou outros)',
  },
  shopee: {
    patterns: [
      { regex: /^BR[0-9A-Z]{6,}$/, minLength: 8, priority: 2 },
    ],
    description: 'Shopee (BR)',
  },
  mercado_livre: {
    patterns: [
      { regex: /^20000[0-9]{6,}$/, minLength: 11, priority: 3 },
      { regex: /^46[0-9]{8,}$/, minLength: 10, priority: 3 },
    ],
    description: 'Mercado Livre (20000 ou 46)',
  },
};

/**
 * Mapeamento centralizado de prefixos -> tipos de pacote
 * Escalável: adicione novos marketplaces aqui sem alterar lógica
 * CRÍTICO: Ordem importa! AVULSO é verificado primeiro
 */
const PREFIX_MAPPINGS: PrefixMapping[] = [
  {
    prefixes: ['LM'],
    type: 'avulso',
    audioKey: 'beep_c',
  },
  {
    prefixes: ['BR'],
    type: 'shopee',
    audioKey: 'beep_a',
  },
  {
    prefixes: ['20000', '46'],
    type: 'mercado_livre',
    audioKey: 'beep_b',
  },
];

/**
 * Cache de validação para evitar re-processamento
 */
const validationCache = new Map<string, { valid: boolean; type: PackageType; }>();

/**
 * Limpa cache periodicamente (a cada 5 minutos)
 */
const CACHE_TTL = 5 * 60 * 1000;
setInterval(() => {
  validationCache.clear();
}, CACHE_TTL);

/**
 * Normaliza o código escanneado para processamento
 * - Remove espaços em branco
 * - Converte para maiúsculas
 * - Remove apenas caracteres realmente especiais
 * - Valida padrões conhecidos PRIMEIRO
 */
export function normalizeCode(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    return '';
  }

  const trimmed = rawCode.trim().toUpperCase();

  if (trimmed.length === 0) {
    return '';
  }

  // Tenta extrair padrões conhecidos primeiro
  // CRÍTICO: Ordem LM -> BR -> 20000/46 para evitar confusão
  const extracted =
    trimmed.match(/^(LM[0-9A-Z]{2,})/)?.[1] ||
    trimmed.match(/^(BR[0-9A-Z]{6,})/)?.[1] ||
    trimmed.match(/^(20000[0-9]{6,})/)?.[1] ||
    trimmed.match(/^(46[0-9]{8,})/)?.[1];

  if (extracted) {
    return extracted;
  }

  // Fallback: remove apenas caracteres que não são alfanuméricos
  const cleaned = trimmed.replace(/[^0-9A-Z]/g, '');
  return cleaned;
}

/**
 * Valida se um código está em formato correto
 * Mais robusto que apenas verificar comprimento
 */
export function validateCode(normalizedCode: string): boolean {
  if (!normalizedCode || normalizedCode.length < 3) {
    return false;
  }

  // Apenas alfanuméricos
  if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
    return false;
  }

  // Verifica se corresponde a algum padrão conhecido
  for (const [type, config] of Object.entries(PATTERN_CONFIGS)) {
    for (const patternConfig of config.patterns) {
      if (normalizedCode.length >= patternConfig.minLength && patternConfig.regex.test(normalizedCode)) {
        return true;
      }
    }
  }

  // Se chegou aqui, poderia ser um código desconhecido mas válido
  // Permitir se tem pelo menos 4 caracteres (para dar flexibilidade)
  return normalizedCode.length >= 4;
}

/**
 * Identifica o tipo de pacote baseado em prefixo
 * Determinístico: sempre retorna o mesmo resultado para o mesmo input
 * Usa cache para melhor performance
 */
export function identifyPackage(normalizedCode: string): PackageIdentification {
  if (!normalizedCode || normalizedCode.length === 0) {
    return {
      type: 'unknown',
      matched: false,
      confidence: 'low',
    };
  }

  // Verifica cache primeiro
  const cached = validationCache.get(normalizedCode);
  if (cached) {
    return {
      type: cached.type,
      matched: cached.type !== 'unknown',
      confidence: cached.valid ? 'high' : 'low',
    };
  }

  // Procura por prefixo usando mapeamento centralizado
  // CRÍTICO: A ordem aqui importa!
  for (const mapping of PREFIX_MAPPINGS) {
    for (const prefix of mapping.prefixes) {
      if (normalizedCode.startsWith(prefix)) {
        // Armazena em cache
        validationCache.set(normalizedCode, {
          valid: true,
          type: mapping.type,
        });

        return {
          type: mapping.type,
          matched: true,
          confidence: 'high',
        };
      }
    }
  }

  // Se não é LM/avulso, BR/shopee ou 20000/46/mercado_livre
  // Mas tem padrão válido, é avulso por padrão
  if (validateCode(normalizedCode)) {
    validationCache.set(normalizedCode, {
      valid: true,
      type: 'avulso',
    });

    return {
      type: 'avulso',
      matched: true,
      confidence: 'medium',
    };
  }

  // Nenhum prefixo conhecido e não passa validação
  validationCache.set(normalizedCode, {
    valid: false,
    type: 'unknown',
  });

  return {
    type: 'unknown',
    matched: false,
    confidence: 'low',
  };
}

/**
 * Retorna a chave de áudio correspondente ao tipo
 * Sem duplicação de lógica
 */
export function getAudioKeyForType(type: PackageType): string {
  for (const mapping of PREFIX_MAPPINGS) {
    if (mapping.type === type) {
      return mapping.audioKey;
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
 * Útil para logging e debug
 */
export function extractPrefix(normalizedCode: string): string | null {
  for (const mapping of PREFIX_MAPPINGS) {
    for (const prefix of mapping.prefixes) {
      if (normalizedCode.startsWith(prefix)) {
        return prefix;
      }
    }
  }
  return null;
}

/**
 * Lista todos os prefixos conhecidos (para UI, logs, etc)
 */
export function getAllKnownPrefixes(): string[] {
  return PREFIX_MAPPINGS.flatMap(m => m.prefixes);
}

/**
 * Verifica se um código é definitivamente um tipo específico
 * Mais preciso que apenas identificação
 */
export function isDefinitelyType(normalizedCode: string, type: PackageType): boolean {
  const identification = identifyPackage(normalizedCode);
  return identification.type === type && identification.confidence === 'high';
}

/**
 * Obtém confidence score (0-1) para um tipo
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
 * Limpa o cache manualmente se necessário
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Retorna tamanho atual do cache
 */
export function getCacheSize(): number {
  return validationCache.size;
}
