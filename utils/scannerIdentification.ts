/**
 * Scanner Industrial - Módulo de Identificação
 * Responsável por classificar códigos com base em prefixos
 * Escalável e preparado para novos marketplaces
 */

import {
  PackageType,
  PackageIdentification,
  PrefixMapping,
} from '@/types/scanner';

/**
 * Mapeamento centralizado de prefixos -> tipos de pacote
 * Escalável: adicione novos marketplaces aqui sem alterar lógica
 */
const PREFIX_MAPPINGS: PrefixMapping[] = [
  {
    prefixes: ['BR'],
    type: 'shopee',
    audioKey: 'beep_a',
  },
  {
    prefixes: ['20000', '46', '45'],
    type: 'mercado_livre',
    audioKey: 'beep_b',
  },
  {
    prefixes: ['LM', '14'],
    type: 'avulso',
    audioKey: 'beep_c',
  },
];

/**
 * Normaliza o código escanneado para processamento
 * - Remove espaços em branco
 * - Converte para maiúsculas
 * - Remove caracteres especiais
 */
export function normalizeCode(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    return '';
  }

  const trimmed = rawCode.trim().toUpperCase();

  // Tenta extrair padrões conhecidos primeiro
  const extracted =
    trimmed.match(/^(BR[0-9A-Z]{6,})/)?.[1] ||
    trimmed.match(/^(20000[0-9]{6,})/)?.[1] ||
    trimmed.match(/^(46[0-9]{6,})/)?.[1] ||
    trimmed.match(/^(45[0-9]{6,})/)?.[1] ||
    trimmed.match(/^(LM[0-9A-Z]{2,})/)?.[1] ||
    trimmed.match(/^(14[0-9]{6,})/)?.[1];

  if (extracted) {
    return extracted;
  }

  // Fallback: remove caracteres especiais
  const cleaned = trimmed.replace(/[^0-9A-Z]/g, '');
  return cleaned;
}

/**
 * Identifica o tipo de pacote baseado em prefixo
 * Determinístico: sempre retorna o mesmo resultado para o mesmo input
 */
export function identifyPackage(normalizedCode: string): PackageIdentification {
  if (!normalizedCode || normalizedCode.length === 0) {
    return {
      type: 'unknown',
      matched: false,
      confidence: 'low',
    };
  }

  // Procura por prefixo usando mapeamento centralizado
  for (const mapping of PREFIX_MAPPINGS) {
    for (const prefix of mapping.prefixes) {
      if (normalizedCode.startsWith(prefix)) {
        return {
          type: mapping.type,
          matched: true,
          confidence: 'high',
        };
      }
    }
  }

  // Nenhum prefixo conhecido
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
 * Valida se o código é válido para processamento
 * (comprimento mínimo, caracteres válidos, etc)
 */
export function validateCode(normalizedCode: string): boolean {
  if (!normalizedCode || normalizedCode.length < 3) {
    return false;
  }

  // Apenas alfanuméricos
  if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
    return false;
  }

  return true;
}
