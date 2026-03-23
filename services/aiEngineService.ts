/**
 * AI Engine Service
 * Serviço unificado que integra detecção de padrões, sugestões inteligentes e aprendizado
 */

import { 
  DetectedPattern, 
  SmartSuggestion, 
  OperatorLearning, 
  PredictiveAnalysis,
  AIEngineConfig,
  AIEngineState,
  ScanLearningEvent 
} from '@/types/aiPatternRecognition';
import { PackageType } from '@/types/scanner';
import { ScannedPackage } from '@/types/session';
import { patternDetectionService } from './patternDetectionService';
import { smartSuggestionsService } from './smartSuggestionsService';
import { operatorLearningService } from './operatorLearningService';

export class AIEngineService {
  private config: AIEngineConfig = {
    enablePatternDetection: true,
    enableSmartSuggestions: true,
    enableOperatorLearning: true,
    minPatternLength: 3,
    maxSuggestions: 5,
    confidenceThreshold: 0.6,
    learningRate: 0.1,
    historyWeight: 0.3,
    patternWeight: 0.4,
    mlWeight: 0.3,
  };

  private state: AIEngineState = {
    isLearning: true,
    patternsDetected: 0,
    suggestionsGenerated: 0,
    accuracyRate: 0,
    lastPatternUpdate: Date.now(),
    operatorModelsLoaded: [],
    engineVersion: '1.0.0',
  };

  private sessionPackages: ScannedPackage[] = [];
  private currentSessionId: string = '';
  private currentOperatorId: string = '';

  /**
   * Configura o motor de IA
   */
  configure(config: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): AIEngineConfig {
    return { ...this.config };
  }

  /**
   * Obtém estado atual do motor
   */
  getState(): AIEngineState {
    return { ...this.state };
  }

  /**
   * Inicia nova sessão de scanning
   */
  startSession(sessionId: string, operatorId: string): void {
    this.currentSessionId = sessionId;
    this.currentOperatorId = operatorId;
    this.sessionPackages = [];
    
    // Carregar perfil do operador se não estiver carregado
    if (!this.state.operatorModelsLoaded.includes(operatorId)) {
      const profile = operatorLearningService.getOperatorProfile(operatorId);
      if (profile) {
        this.state.operatorModelsLoaded.push(operatorId);
      }
    }
  }

  /**
   * Processa novo scan e atualiza aprendizado
   */
  async processScan(
    code: string, 
    actualType: PackageType,
    predictedType?: PackageType,
    processingTime: number = 0
  ): Promise<{
    suggestions: SmartSuggestion[];
    patterns: DetectedPattern[];
    insights: string[];
  }> {
    const startTime = Date.now();
    
    // Criar pacote
    const packageData: ScannedPackage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      code,
      type: actualType,
      scannedAt: new Date().toISOString(),
    };

    // Adicionar à sessão atual
    this.sessionPackages.push(packageData);

    // Registrar evento de aprendizado
    const learningEvent: ScanLearningEvent = {
      code,
      actualType,
      predictedType,
      wasCorrect: actualType === predictedType || !predictedType,
      processingTime,
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      operatorId: this.currentOperatorId,
      context: {
        previousCode: this.sessionPackages.length > 1 ? this.sessionPackages[this.sessionPackages.length - 2].code : undefined,
        positionInSession: this.sessionPackages.length,
        timeOfDay: this.getTimeOfDay(),
      },
    };

    if (this.config.enableOperatorLearning) {
      operatorLearningService.registerLearningEvent(learningEvent);
    }

    // Gerar sugestões
    let suggestions: SmartSuggestion[] = [];
    if (this.config.enableSmartSuggestions && this.sessionPackages.length > 0) {
      suggestions = smartSuggestionsService.generateSmartSuggestions(
        this.sessionPackages,
        this.currentOperatorId
      );
      this.state.suggestionsGenerated += suggestions.length;
    }

    // Detectar padrões
    let patterns: DetectedPattern[] = [];
    if (this.config.enablePatternDetection && this.sessionPackages.length >= this.config.minPatternLength) {
      const recentCodes = this.sessionPackages.slice(-10).map(pkg => pkg.code);
      patterns = patternDetectionService.analyzePatterns(recentCodes);
      this.state.patternsDetected += patterns.length;
      this.state.lastPatternUpdate = Date.now();
    }

    // Gerar insights
    const insights = this.generateInsights(packageData, learningEvent, suggestions, patterns);

    // Atualizar métricas de estado
    this.updateStateMetrics();

    return {
      suggestions,
      patterns,
      insights,
    };
  }

  /**
   * Gera análise preditiva completa
   */
  generatePredictiveAnalysis(): PredictiveAnalysis {
    const recentPackages = this.sessionPackages.slice(-20);
    
    // Gerar sugestões para próximos códigos
    const expectedNextCodes = smartSuggestionsService.generateSmartSuggestions(
      recentPackages,
      this.currentOperatorId
    );

    // Detectar padrões atuais
    const recentCodes = recentPackages.map(pkg => pkg.code);
    const currentPatterns = patternDetectionService.analyzePatterns(recentCodes);
    const patternConfidence = currentPatterns.length > 0 
      ? Math.max(...currentPatterns.map(p => p.confidence))
      : 0;

    // Prever tempo de conclusão
    const completionPrediction = this.predictCompletionTime(recentPackages);

    // Prever acurácia
    const accuracyPrediction = this.predictAccuracy(recentPackages);

    // Obter perfil do operador
    const operatorProfile = operatorLearningService.getOperatorProfile(this.currentOperatorId);
    const operatorMetrics = operatorLearningService.getOperatorMetrics(this.currentOperatorId);

    // Gerar insights da sessão
    const sessionInsights = this.generateSessionInsights(recentPackages, currentPatterns);

    // Gerar recomendações
    const recommendations = this.generateRecommendations(
      recentPackages,
      currentPatterns,
      operatorMetrics
    );

    return {
      currentSession: {
        expectedNextCodes,
        patternConfidence,
        completionPrediction,
        accuracyPrediction,
      },
      operatorProfile: {
        dominantPatterns: this.getDominantPatterns(currentPatterns),
        averageSpeed: operatorMetrics?.averageSpeed || 0,
        accuracyTrend: this.calculateAccuracyTrend(operatorMetrics?.accuracyHistory || []),
        preferredPackageTypes: operatorMetrics?.preferredTypes || ['avulso'],
      },
      sessionInsights,
      recommendations,
    };
  }

  /**
   * Prediz tipo de pacote usando ML
   */
  predictPackageType(code: string): { type: PackageType; confidence: number } {
    if (!this.config.enableOperatorLearning || !this.currentOperatorId) {
      return { type: 'avulso', confidence: 0.5 };
    }

    return operatorLearningService.predictPackageType(
      code,
      this.currentOperatorId,
      this.getTimeOfDay()
    );
  }

  /**
   * Obtém insights do operador atual
   */
  getOperatorInsights(): string[] {
    if (!this.currentOperatorId) {
      return [];
    }

    return operatorLearningService.getOperatorInsights(this.currentOperatorId);
  }

  /**
   * Finaliza sessão atual
   */
  endSession(): void {
    // Limpar dados temporários
    this.sessionPackages = [];
    this.currentSessionId = '';
    this.currentOperatorId = '';
  }

  /**
   * Gera insights baseados no scan atual
   */
  private generateInsights(
    packageData: ScannedPackage,
    learningEvent: ScanLearningEvent,
    suggestions: SmartSuggestion[],
    patterns: DetectedPattern[]
  ): string[] {
    const insights: string[] = [];

    // Insights baseados na acurácia
    if (learningEvent.wasCorrect) {
      insights.push('✅ Identificação correta');
    } else {
      insights.push('⚠️ Revisar identificação de tipo');
    }

    // Insights baseados na velocidade
    if (learningEvent.processingTime < 200) {
      insights.push('⚡ Scan rápido e eficiente');
    } else if (learningEvent.processingTime > 1000) {
      insights.push('🐢 Scanner um pouco lento');
    }

    // Insights baseados em sugestões
    if (suggestions.length > 0) {
      const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
      if (highConfidenceSuggestions.length > 0) {
        insights.push('🎯 Padrões claros detectados');
      }
    }

    // Insights baseados em padrões
    if (patterns.length > 0) {
      const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
      if (highConfidencePatterns.length > 0) {
        insights.push('🔍 Sequências identificadas');
      }
    }

    // Insights baseados no progresso da sessão
    if (this.sessionPackages.length % 10 === 0 && this.sessionPackages.length > 0) {
      insights.push(`📊 ${this.sessionPackages.length} pacotes processados`);
    }

    return insights;
  }

  /**
   * Prediz tempo de conclusão
   */
  private predictCompletionTime(recentPackages: ScannedPackage[]): number {
    if (recentPackages.length < 3) return 0;

    // Calcular velocidade média dos últimos pacotes
    const timeDifferences = [];
    for (let i = 1; i < recentPackages.length; i++) {
      const currentTime = new Date(recentPackages[i].scannedAt).getTime();
      const previousTime = new Date(recentPackages[i - 1].scannedAt).getTime();
      timeDifferences.push(currentTime - previousTime);
    }

    const avgTimePerPackage = timeDifferences.reduce((sum, time) => sum + time, 0) / timeDifferences.length;
    
    // Estimar tempo restante baseado na velocidade atual
    const estimatedRemainingPackages = Math.max(0, 50 - recentPackages.length); // Assumindo 50 como meta
    return (estimatedRemainingPackages * avgTimePerPackage) / (1000 * 60); // Converter para minutos
  }

  /**
   * Prediz acurácia
   */
  private predictAccuracy(recentPackages: ScannedPackage[]): number {
    if (recentPackages.length < 5) return 0.8;

    // Obter métricas do operador
    const operatorMetrics = operatorLearningService.getOperatorMetrics(this.currentOperatorId);
    
    if (operatorMetrics && operatorMetrics.accuracyHistory && operatorMetrics.accuracyHistory.length > 0) {
      // Calcular tendência de acurácia
      const recentAccuracy = operatorMetrics.accuracyHistory.slice(-10);
      return recentAccuracy.reduce((sum: number, acc: number) => sum + acc, 0) / recentAccuracy.length;
    }

    return 0.8; // Default 80%
  }

  /**
   * Obtém padrões dominantes
   */
  private getDominantPatterns(patterns: DetectedPattern[]): string[] {
    return patterns
      .filter(p => p.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(p => p.pattern);
  }

  /**
   * Calcula tendência de acurácia
   */
  private calculateAccuracyTrend(accuracyHistory: number[] = []): 'improving' | 'stable' | 'declining' {
    if (accuracyHistory.length < 5) return 'stable';

    const recent = accuracyHistory.slice(-5);
    const older = accuracyHistory.slice(-10, -5);

    const recentAvg = recent.reduce((sum: number, acc: number) => sum + acc, 0) / recent.length;
    const olderAvg = older.reduce((sum: number, acc: number) => sum + acc, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Gera insights da sessão
   */
  private generateSessionInsights(
    packages: ScannedPackage[],
    patterns: DetectedPattern[]
  ): string[] {
    const insights: string[] = [];

    // Analisar distribuição de tipos
    const typeCount = this.countPackageTypes(packages);
    const totalPackages = packages.length;

    for (const [type, count] of Object.entries(typeCount)) {
      const percentage = (count / totalPackages) * 100;
      if (percentage > 50) {
        insights.push(`📦 Predominância de pacotes ${type} (${Math.round(percentage)}%)`);
      }
    }

    // Analisar padrões
    if (patterns.length > 0) {
      insights.push(`🔍 ${patterns.length} padrão(s) detectado(s)`);
    }

    // Analisar velocidade
    if (packages.length > 5) {
      const timeSpan = this.calculateTimeSpan(packages);
      const rate = packages.length / (timeSpan / 60000); // pacotes por minuto
      
      if (rate > 10) {
        insights.push('⚡ Alta velocidade de scanning');
      } else if (rate < 3) {
        insights.push('🐢 Baixa velocidade de scanning');
      }
    }

    return insights;
  }

  /**
   * Gera recomendações
   */
  private generateRecommendations(
    packages: ScannedPackage[],
    patterns: DetectedPattern[],
    operatorMetrics: any
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em padrões
    if (patterns.length === 0 && packages.length > 10) {
      recommendations.push('🔍 Considere procurar padrões para otimizar');
    }

    // Recomendações baseadas em métricas do operador
    if (operatorMetrics) {
      if (operatorMetrics.accuracy < 0.8) {
        recommendations.push('📚 Revisar guia de identificação de pacotes');
      }
      
      if (operatorMetrics.averageSpeed > 1000) {
        recommendations.push('⚡ Técnicas de scanning mais rápido podem ajudar');
      }
    }

    // Recomendações baseadas na sessão
    if (packages.length > 20) {
      recommendations.push('💡 Faça pausas curtas para manter a precisão');
    }

    return recommendations;
  }

  /**
   * Conta tipos de pacotes
   */
  private countPackageTypes(packages: ScannedPackage[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const pkg of packages) {
      counts[pkg.type] = (counts[pkg.type] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Calcula tempo span dos pacotes
   */
  private calculateTimeSpan(packages: ScannedPackage[]): number {
    if (packages.length < 2) return 0;

    const firstTime = new Date(packages[0].scannedAt).getTime();
    const lastTime = new Date(packages[packages.length - 1].scannedAt).getTime();
    
    return lastTime - firstTime;
  }

  /**
   * Obtém hora do dia atual
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else {
      return 'evening';
    }
  }

  /**
   * Atualiza métricas de estado
   */
  private updateStateMetrics(): void {
    const metrics = operatorLearningService.getOperatorMetrics(this.currentOperatorId);
    
    if (metrics) {
      this.state.accuracyRate = metrics.accuracy;
    }
  }

  /**
   * Exporta dados de aprendizado
   */
  exportLearningData(): any {
    return {
      config: this.config,
      state: this.state,
      operatorLearning: operatorLearningService.exportLearningData(),
      sessionData: {
        sessionId: this.currentSessionId,
        operatorId: this.currentOperatorId,
        packages: this.sessionPackages,
      },
    };
  }

  /**
   * Importa dados de aprendizado
   */
  importLearningData(data: any): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    
    if (data.state) {
      this.state = { ...this.state, ...data.state };
    }
    
    if (data.operatorLearning) {
      operatorLearningService.importLearningData(data.operatorLearning);
    }
  }

  /**
   * Limpa dados antigos
   */
  clearOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    operatorLearningService.clearOldData(maxAge);
    patternDetectionService.clearOldPatterns(maxAge);
    smartSuggestionsService.clearOldHistory(maxAge);
  }
}

// Export singleton instance
export const aiEngineService = new AIEngineService();
