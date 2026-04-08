/**
 * Scanner Industrial - Type Definitions
 * Definições de tipos para o sistema robusto de scanner
 */

/**
 * Tipos de pacotes identificáveis pelo scanner
 */
export type PackageType = 'shopee' | 'mercado_livre' | 'avulso' | 'unknown';

/**
 * Estado do scanner - Determinístico
 */
export enum ScannerState {
  ACTIVE = 'ACTIVE',
  LIMIT_REACHED = 'LIMIT_REACHED',
  PAUSED = 'PAUSED',
}

/**
 * Resultado da identificação de pacote
 */
export interface PackageIdentification {
  type: PackageType;
  matched: boolean;
  confidence: 'high' | 'medium' | 'low';
  description?: string;
}

/**
 * Configuração de prefixo para classificação
 */
export interface PrefixMapping {
  prefixes: string[];
  type: PackageType;
  audioKey: string; // Chave para áudio (beep_a, beep_b, beep_c, beep_error)
}

/**
 * Estatísticas do scanner
 */
export interface ScannerStats {
  totalScans: number;
  validScans: number;
  duplicates: number;
  unknownTypes: number;
  timestamp: number;
}

/**
 * Configuração do controller do scanner
 */
export interface ScannerConfig {
  maxAllowedScans: {
    shopee: number;
    mercado_livre: number;
    avulso: number;
    total?: number; // Opcional: limite total global
  };
  debounceMs?: number; // Default: 400ms
  onStateChange?: (state: ScannerState) => void;
  onStatsUpdate?: (stats: ScannerStats) => void;
}

/**
 * Resultado de uma tentativa de scan
 */
export interface ScanResult {
  success: boolean;
  code: string;
  type?: PackageType;
  isDuplicate?: boolean;
  reason?: 'limit_reached' | 'duplicate' | 'invalid' | 'rate_limited';
  timestamp: number;
}

/**
 * Evento de scan para o componente UI
 */
export interface ScanEvent {
  code: string;
  type: PackageType;
  isDuplicate: boolean;
  isValid: boolean;
  timestamp: number;
  scanCount: number;
}

/**
 * Estado interno do scanner controller
 */
export interface ScannerInternalState {
  state: ScannerState;
  scanCounts: Record<PackageType, number>;
  lastValidScan: {
    code: string;
    type: PackageType;
    timestamp: number;
  } | null;
  lastAudioTime: number; // Último tempo que áudio foi tocado
  isProcessing: boolean; // Flag de processamento em curso
  stats: ScannerStats;
}
