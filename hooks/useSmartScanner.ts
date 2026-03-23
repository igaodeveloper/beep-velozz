/**
 * Hook para IA de Scanner Inteligente
 * Integra detecção de padrões, sugestões e aprendizado contínuo
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PackageType } from '@/types/scanner';
import { ScannedPackage } from '@/types/session';
import { SmartSuggestion, PredictiveAnalysis } from '@/types/aiPatternRecognition';
import { aiEngineService } from '@/services/aiEngineService';

interface UseSmartScannerOptions {
  sessionId: string;
  operatorId: string;
  enablePatternDetection?: boolean;
  enableSmartSuggestions?: boolean;
  enableOperatorLearning?: boolean;
}

interface SmartScannerState {
  isLearning: boolean;
  currentSuggestions: SmartSuggestion[];
  detectedPatterns: any[];
  insights: string[];
  predictiveAnalysis: PredictiveAnalysis | null;
  operatorInsights: string[];
  isProcessing: boolean;
}

export function useSmartScanner(options: UseSmartScannerOptions) {
  const {
    sessionId,
    operatorId,
    enablePatternDetection = true,
    enableSmartSuggestions = true,
    enableOperatorLearning = true,
  } = options;

  const [state, setState] = useState<SmartScannerState>({
    isLearning: true,
    currentSuggestions: [],
    detectedPatterns: [],
    insights: [],
    predictiveAnalysis: null,
    operatorInsights: [],
    isProcessing: false,
  });

  // Configurar motor de IA
  useEffect(() => {
    aiEngineService.configure({
      enablePatternDetection,
      enableSmartSuggestions,
      enableOperatorLearning,
      minPatternLength: 3,
      maxSuggestions: 5,
      confidenceThreshold: 0.6,
      learningRate: 0.1,
      historyWeight: 0.3,
      patternWeight: 0.4,
      mlWeight: 0.3,
    });

    // Iniciar sessão
    aiEngineService.startSession(sessionId, operatorId);

    // Carregar insights do operador
    const insights = aiEngineService.getOperatorInsights();
    setState(prev => ({ ...prev, operatorInsights: insights }));
  }, [sessionId, operatorId, enablePatternDetection, enableSmartSuggestions, enableOperatorLearning]);

  // Processar novo scan
  const processScan = useCallback(async (
    code: string,
    actualType: PackageType,
    predictedType?: PackageType,
    processingTime?: number
  ) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await aiEngineService.processScan(
        code,
        actualType,
        predictedType,
        processingTime
      );

      setState(prev => ({
        ...prev,
        currentSuggestions: result.suggestions,
        detectedPatterns: result.patterns,
        insights: result.insights,
        isProcessing: false,
      }));

      return result;
    } catch (error) {
      console.error('Error processing scan:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      return null;
    }
  }, []);

  // Prediz tipo de pacote
  const predictPackageType = useCallback((code: string) => {
    return aiEngineService.predictPackageType(code);
  }, []);

  // Gera análise preditiva
  const generatePredictiveAnalysis = useCallback(() => {
    const analysis = aiEngineService.generatePredictiveAnalysis();
    setState(prev => ({ ...prev, predictiveAnalysis: analysis }));
    return analysis;
  }, []);

  // Atualiza insights do operador
  const refreshOperatorInsights = useCallback(() => {
    const insights = aiEngineService.getOperatorInsights();
    setState(prev => ({ ...prev, operatorInsights: insights }));
  }, []);

  // Limpa sugestões atuais
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, currentSuggestions: [] }));
  }, []);

  // Obtém estado atual do motor
  const getEngineState = useCallback(() => {
    return aiEngineService.getState();
  }, []);

  // Memoizar valores computados
  const hasHighConfidenceSuggestions = useMemo(() => {
    return state.currentSuggestions.some(s => s.confidence > 0.8);
  }, [state.currentSuggestions]);

  const topSuggestion = useMemo(() => {
    return state.currentSuggestions.length > 0 ? state.currentSuggestions[0] : null;
  }, [state.currentSuggestions]);

  const hasPatternsDetected = useMemo(() => {
    return state.detectedPatterns.length > 0;
  }, [state.detectedPatterns]);

  // Finalizar sessão
  useEffect(() => {
    return () => {
      aiEngineService.endSession();
    };
  }, []);

  return {
    // Estado
    ...state,
    hasHighConfidenceSuggestions,
    topSuggestion,
    hasPatternsDetected,

    // Métodos
    processScan,
    predictPackageType,
    generatePredictiveAnalysis,
    refreshOperatorInsights,
    clearSuggestions,
    getEngineState,

    // Configuração
    configure: aiEngineService.configure.bind(aiEngineService),
    
    // Exportação/Importação
    exportLearningData: aiEngineService.exportLearningData.bind(aiEngineService),
    importLearningData: aiEngineService.importLearningData.bind(aiEngineService),
  };
}
