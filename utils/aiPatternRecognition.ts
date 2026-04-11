/**
 * AI Pattern Recognition System
 * Sistema de reconhecimento de padrões usando IA para detectar anomalias e prever problemas
 */

import { Session, ScannedPackage, OperatorStats } from "@/types/session";
import { PackageType } from "@/types/scanner";

export interface PatternInsight {
  type: "anomaly" | "prediction" | "recommendation" | "warning";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number; // 0-1
  timestamp: number;
  actionable: boolean;
  category: "performance" | "quality" | "efficiency" | "compliance";
}

export interface AIModelConfig {
  anomalyThreshold: number;
  predictionWindow: number; // minutes
  minDataPoints: number;
  confidenceThreshold: number;
}

class AIPatternRecognition {
  private config: AIModelConfig;
  private historicalData: Session[] = [];
  private patterns: Map<string, PatternInsight[]> = new Map();

  constructor(config: Partial<AIModelConfig> = {}) {
    this.config = {
      anomalyThreshold: 0.15,
      predictionWindow: 30,
      minDataPoints: 10,
      confidenceThreshold: 0.7,
      ...config,
    };
  }

  /**
   * Analisa sessões em tempo real para detectar padrões
   */
  async analyzeSession(
    session: Session,
    historicalSessions: Session[],
  ): Promise<PatternInsight[]> {
    this.historicalData = historicalSessions;
    const insights: PatternInsight[] = [];

    // 1. Detecção de anomalias de velocidade
    const speedAnomaly = this.detectSpeedAnomaly(session);
    if (speedAnomaly) insights.push(speedAnomaly);

    // 2. Previsão de divergência
    const divergencePrediction = this.predictDivergence(session);
    if (divergencePrediction) insights.push(divergencePrediction);

    // 3. Detecção de padrão de erros
    const errorPattern = this.detectErrorPattern(session);
    if (errorPattern) insights.push(errorPattern);

    // 4. Recomendações de eficiência
    const efficiencyRec = this.generateEfficiencyRecommendation(session);
    if (efficiencyRec) insights.push(efficiencyRec);

    // 5. Alerta de conformidade
    const complianceAlert = this.checkComplianceRisk(session);
    if (complianceAlert) insights.push(complianceAlert);

    return insights.filter(
      (insight) => insight.confidence >= this.config.confidenceThreshold,
    );
  }

  /**
   * Deteca anomalias na velocidade de scanning
   */
  private detectSpeedAnomaly(session: Session): PatternInsight | null {
    if (this.historicalData.length < this.config.minDataPoints) return null;

    const currentRate = this.calculateScanRate(session);
    const operatorHistory = this.historicalData.filter(
      (s) => s.operatorName === session.operatorName,
    );

    if (operatorHistory.length === 0) return null;

    const avgRate =
      operatorHistory.reduce((sum, s) => sum + this.calculateScanRate(s), 0) /
      operatorHistory.length;
    const deviation = Math.abs(currentRate - avgRate) / avgRate;

    if (deviation > this.config.anomalyThreshold) {
      const isSlower = currentRate < avgRate;
      return {
        type: "anomaly",
        severity: deviation > 0.3 ? "high" : "medium",
        title: isSlower
          ? "Velocidade Abaixo do Padrão"
          : "Velocidade Acima do Padrão",
        description: `Taxa de ${currentRate.toFixed(1)} pacotes/min vs média de ${avgRate.toFixed(1)} pacotes/min`,
        confidence: Math.min(deviation * 2, 1),
        timestamp: Date.now(),
        actionable: true,
        category: "performance",
      };
    }

    return null;
  }

  /**
   * Prevê probabilidade de divergência ao final da sessão
   */
  private predictDivergence(session: Session): PatternInsight | null {
    if (session.packages.length < 5) return null;

    const progress = session.packages.length / session.declaredCount;
    const errorRate = this.calculateErrorRate(session);
    const operatorAvgError = this.getOperatorAverageError(session.operatorName);

    // Calcula probabilidade de divergência
    const divergenceProbability = errorRate * 0.6 + operatorAvgError * 0.4;

    if (divergenceProbability > 0.2) {
      return {
        type: "prediction",
        severity: divergenceProbability > 0.5 ? "high" : "medium",
        title: "Alto Risco de Divergência",
        description: `Probabilidade de ${(divergenceProbability * 100).toFixed(0)}% de divergência ao final da conferência`,
        confidence: Math.min(progress * 1.5, 1),
        timestamp: Date.now(),
        actionable: true,
        category: "compliance",
      };
    }

    return null;
  }

  /**
   * Detecta padrões de erro por tipo de pacote
   */
  private detectErrorPattern(session: Session): PatternInsight | null {
    const errorsByType = this.groupErrorsByType(session);
    const totalErrors = Object.values(errorsByType).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (totalErrors < 3) return null;

    // Encontra o tipo com mais erros
    const problematicType = Object.entries(errorsByType).sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (problematicType && problematicType[1] > totalErrors * 0.6) {
      return {
        type: "anomaly",
        severity: "medium",
        title: "Padrão de Erros Detectado",
        description: `Concentração de erros em pacotes ${problematicType[0]} (${problematicType[1]} ocorrências)`,
        confidence: 0.8,
        timestamp: Date.now(),
        actionable: true,
        category: "quality",
      };
    }

    return null;
  }

  /**
   * Gera recomendações de eficiência baseadas em padrões
   */
  private generateEfficiencyRecommendation(
    session: Session,
  ): PatternInsight | null {
    const packageTypes = this.analyzePackageDistribution(session);
    const bestSequence = this.calculateOptimalScanningSequence(packageTypes);

    if (bestSequence.efficiencyGain > 0.1) {
      return {
        type: "recommendation",
        severity: "low",
        title: "Otimização de Eficiência",
        description: `Reorganize os pacotes na ordem: ${bestSequence.sequence.join(" → ")} para ganhar ${(bestSequence.efficiencyGain * 100).toFixed(0)}% de produtividade`,
        confidence: bestSequence.efficiencyGain,
        timestamp: Date.now(),
        actionable: true,
        category: "efficiency",
      };
    }

    return null;
  }

  /**
   * Verifica riscos de conformidade em tempo real
   */
  private checkComplianceRisk(session: Session): PatternInsight | null {
    const timeElapsed = Date.now() - new Date(session.startedAt).getTime();
    const expectedProgress =
      (timeElapsed / (1000 * 60 * 60)) *
      this.getExpectedHourlyRate(session.operatorName);
    const actualProgress = session.packages.length;

    if (
      actualProgress < expectedProgress * 0.5 &&
      timeElapsed > 1000 * 60 * 30
    ) {
      return {
        type: "warning",
        severity: "medium",
        title: "Risco de Não Conformidade",
        description:
          "Progresso significativamente abaixo do esperado para o tempo decorrido",
        confidence: 0.75,
        timestamp: Date.now(),
        actionable: true,
        category: "compliance",
      };
    }

    return null;
  }

  // Métodos utilitários
  private calculateScanRate(session: Session): number {
    if (!session.completedAt) return 0;

    const duration =
      (new Date(session.completedAt).getTime() -
        new Date(session.startedAt).getTime()) /
      (1000 * 60);
    return duration > 0 ? session.packages.length / duration : 0;
  }

  private calculateErrorRate(session: Session): number {
    // Simula taxa de erro baseada em padrões
    return session.hasDivergence ? 0.3 : 0.05;
  }

  private getOperatorAverageError(operatorName: string): number {
    const operatorSessions = this.historicalData.filter(
      (s) => s.operatorName === operatorName,
    );
    if (operatorSessions.length === 0) return 0.1;

    const errorCount = operatorSessions.filter((s) => s.hasDivergence).length;
    return errorCount / operatorSessions.length;
  }

  private groupErrorsByType(session: Session): Record<string, number> {
    // Simula agrupamento de erros por tipo
    const errors: Record<string, number> = {};
    session.packages.forEach((pkg) => {
      if (Math.random() < 0.1) {
        // Simulação de erro
        errors[pkg.type] = (errors[pkg.type] || 0) + 1;
      }
    });
    return errors;
  }

  private analyzePackageDistribution(
    session: Session,
  ): Record<PackageType, number> {
    const distribution: Record<PackageType, number> = {
      shopee: 0,
      mercado_livre: 0,
      avulso: 0,
      unknown: 0,
    };

    session.packages.forEach((pkg) => {
      distribution[pkg.type]++;
    });

    return distribution;
  }

  private calculateOptimalScanningSequence(
    distribution: Record<PackageType, number>,
  ): {
    sequence: PackageType[];
    efficiencyGain: number;
  } {
    // Simula cálculo de sequência ótima
    const sorted = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type as PackageType);

    return {
      sequence: sorted,
      efficiencyGain: 0.15, // Simulação de ganho
    };
  }

  private getExpectedHourlyRate(operatorName: string): number {
    const operatorStats = this.getOperatorStats(operatorName);
    return operatorStats.avgRatePerMinute * 60;
  }

  private getOperatorStats(operatorName: string): OperatorStats {
    const sessions = this.historicalData.filter(
      (s) => s.operatorName === operatorName,
    );

    if (sessions.length === 0) {
      return {
        name: operatorName,
        totalSessions: 0,
        totalPackages: 0,
        avgRatePerMinute: 10, // Default
        errorRate: 0.1,
        avgResponseTime: 2000,
        preferredMarketplace: "shopee",
        accuracyScore: 90,
      };
    }

    const totalPackages = sessions.reduce(
      (sum, s) => sum + s.packages.length,
      0,
    );
    const totalDuration = sessions.reduce((sum, s) => {
      const duration = s.completedAt
        ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
        : 0;
      return sum + duration;
    }, 0);

    const avgRatePerMinute =
      totalDuration > 0 ? totalPackages / (totalDuration / (1000 * 60)) : 0;
    const errorRate =
      sessions.filter((s) => s.hasDivergence).length / sessions.length;

    return {
      name: operatorName,
      totalSessions: sessions.length,
      totalPackages,
      avgRatePerMinute,
      errorRate,
      avgResponseTime: 2000,
      preferredMarketplace: "shopee",
      accuracyScore: (1 - errorRate) * 100,
    };
  }

  /**
   * Treina o modelo com dados históricos
   */
  async trainModel(sessions: Session[]): Promise<void> {
    this.historicalData = sessions;
    console.log(`Model trained with ${sessions.length} sessions`);
  }

  /**
   * Obtém insights acumulados para um operador
   */
  getOperatorInsights(operatorName: string): PatternInsight[] {
    const key = `operator_${operatorName}`;
    return this.patterns.get(key) || [];
  }

  /**
   * Limpa cache de padrões
   */
  clearCache(): void {
    this.patterns.clear();
  }
}

// Export singleton
export const aiPatternRecognition = new AIPatternRecognition();
