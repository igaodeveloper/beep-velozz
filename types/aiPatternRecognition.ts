/**
 * Advanced Pattern Detection and Machine Learning Types
 * Tipos para sistema de IA preditiva e aprendizado contínuo
 */

import { PackageType } from './scanner';
import { ScannedPackage } from './session';

/**
 * Padrão detectado em sequência de códigos
 */
export interface DetectedPattern {
  type: 'sequential' | 'prefix' | 'suffix' | 'numeric' | 'alphanumeric' | 'mixed';
  confidence: number;
  pattern: string;
  examples: string[];
  nextPredicted?: string;
  metadata: {
    sequenceLength: number;
    commonDifference?: number;
    prefix?: string;
    suffix?: string;
    detectedAt: number;
  };
}

/**
 * Sugestão inteligente para próximo código
 */
export interface SmartSuggestion {
  id: string;
  code: string;
  type: PackageType;
  confidence: number;
  reason: string;
  source: 'pattern' | 'history' | 'ml_model' | 'sequential' | 'operator_habit';
  priority: 'high' | 'medium' | 'low';
  metadata: {
    patternId?: string;
    historicalMatches?: number;
    operatorAccuracy?: number;
    predictedSuccess?: number;
  };
}

/**
 * Dados de aprendizado do operador
 */
export interface OperatorLearning {
  operatorId: string;
  operatorName: string;
  scanPatterns: Map<string, number>; // padrão -> frequência
  codePreferences: Map<string, PackageType>; // código preferido -> tipo
  timePatterns: {
    morning: number[];
    afternoon: number[];
    evening: number[];
  };
  accuracyHistory: number[];
  speedHistory: number[];
  preferredSequences: string[];
  commonMistakes: {
    pattern: string;
    correction: string;
    frequency: number;
  }[];
  lastUpdated: number;
}

/**
 * Resultado da análise preditiva
 */
export interface PredictiveAnalysis {
  currentSession: {
    expectedNextCodes: SmartSuggestion[];
    patternConfidence: number;
    completionPrediction: number; // minutos restantes
    accuracyPrediction: number;
  };
  operatorProfile: {
    dominantPatterns: string[];
    averageSpeed: number;
    accuracyTrend: 'improving' | 'stable' | 'declining';
    preferredPackageTypes: PackageType[];
  };
  sessionInsights: string[];
  recommendations: string[];
}

/**
 * Evento de scan para aprendizado
 */
export interface ScanLearningEvent {
  code: string;
  actualType: PackageType;
  predictedType?: PackageType;
  wasCorrect: boolean;
  processingTime: number;
  timestamp: number;
  sessionId: string;
  operatorId: string;
  context: {
    previousCode?: string;
    nextCode?: string;
    positionInSession: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  };
}

/**
 * Configuração do motor de IA
 */
export interface AIMachineConfig {
  enablePatternDetection: boolean;
  enableSmartSuggestions: boolean;
  enableOperatorLearning: boolean;
  minPatternLength: number;
  maxSuggestions: number;
  confidenceThreshold: number;
  learningRate: number;
  historyWeight: number;
  patternWeight: number;
  mlWeight: number;
}

/**
 * Alias para compatibilidade
 */
export type AIEngineConfig = AIMachineConfig;

/**
 * Estado do motor de IA
 */
export interface AIEngineState {
  isLearning: boolean;
  patternsDetected: number;
  suggestionsGenerated: number;
  accuracyRate: number;
  lastPatternUpdate: number;
  operatorModelsLoaded: string[];
  engineVersion: string;
}

/**
 * Métricas do operador expandidas
 */
export interface OperatorMetrics {
  accuracy: number;
  averageSpeed: number;
  totalScans: number;
  preferredTypes: PackageType[];
  errorPatterns: string[];
  accuracyHistory?: number[];
}
