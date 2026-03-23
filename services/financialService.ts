/**
 * Financial Calculation Service
 * Sistema completo de cálculo financeiro e ROI
 */

import {
  FinancialMetrics,
  PackageValueConfig,
  SessionFinancials,
  OperatorFinancialSummary,
  ROIAnalysis,
  FinancialReport,
  CostBreakdown,
  RevenueProjection,
  FinancialKPI
} from '@/types/financial';
import { PackageType } from '@/types/scanner';
import { ScannedPackage } from '@/types/session';
import { Session } from '@/types/session';

export class FinancialService {
  private valueConfig: PackageValueConfig = {
    shopee: 6.00,
    mercadoLivre: 8.00,
    avulso: 8.00,
    bonusThresholds: {
      accuracy: [
        { threshold: 95, bonus: 0.10 },
        { threshold: 98, bonus: 0.15 },
        { threshold: 100, bonus: 0.25 }
      ],
      speed: [
        { threshold: 3.0, bonus: 0.05 }, // 3 segundos por pacote
        { threshold: 2.0, bonus: 0.10 },
        { threshold: 1.5, bonus: 0.15 }
      ],
      volume: [
        { threshold: 100, bonus: 0.05 }, // 100 pacotes por dia
        { threshold: 200, bonus: 0.10 },
        { threshold: 300, bonus: 0.15 }
      ]
    },
    penalties: {
      error: 2.00, // R$ 2.00 por erro
      divergence: 5.00, // R$ 5.00 por divergência
      timeout: 1.00 // R$ 1.00 por timeout
    }
  };

  /**
   * Calcula métricas financeiras de uma sessão
   */
  calculateSessionFinancials(
    session: Session,
    operatorId: string,
    scanTimes: number[] = []
  ): SessionFinancials {
    const startTime = new Date(session.startedAt).getTime();
    const endTime = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutos

    // Contar pacotes por tipo
    const packages = {
      shopee: session.packages.filter(pkg => pkg.type === 'shopee').length,
      mercadoLivre: session.packages.filter(pkg => pkg.type === 'mercado_livre').length,
      avulso: session.packages.filter(pkg => pkg.type === 'avulso').length,
      total: session.packages.length
    };

    // Calcular valor base
    const baseValue = 
      (packages.shopee * this.valueConfig.shopee) +
      (packages.mercadoLivre * this.valueConfig.mercadoLivre) +
      (packages.avulso * this.valueConfig.avulso);

    // Calcular bônus
    const bonuses = this.calculateBonuses(session, scanTimes, packages.total);
    
    // Calcular penalidades
    const penalties = this.calculatePenalties(session);

    // Valor total
    const totalValue = baseValue + bonuses.accuracy + bonuses.speed + bonuses.streak + bonuses.volume + bonuses.special - penalties.errors - penalties.divergences - penalties.timeouts;

    // Taxa horária
    const hourlyRate = duration > 0 ? (totalValue / duration) * 60 : 0;

    // Eficiência (pacotes por hora)
    const efficiency = duration > 0 ? (packages.total / duration) * 60 : 0;

    // ROI simplificado
    const roi = baseValue > 0 ? ((totalValue - baseValue) / baseValue) * 100 : 0;

    return {
      sessionId: session.id,
      operatorId,
      startTime,
      endTime,
      duration,
      packages,
      baseValue,
      bonuses,
      penalties,
      totalValue,
      hourlyRate,
      efficiency,
      roi
    };
  }

  /**
   * Calcula bônus baseados em performance
   */
  private calculateBonuses(
    session: Session,
    scanTimes: number[],
    totalPackages: number
  ): SessionFinancials['bonuses'] {
    const bonuses = {
      accuracy: 0,
      speed: 0,
      streak: 0,
      volume: 0,
      special: 0
    };

    // Bônus de acurácia
    const accuracy = this.calculateAccuracy(session);
    for (const threshold of this.valueConfig.bonusThresholds.accuracy) {
      if (accuracy >= threshold.threshold) {
        bonuses.accuracy = this.getBaseValue(session) * threshold.bonus;
        break;
      }
    }

    // Bônus de velocidade
    if (scanTimes.length > 0) {
      const avgScanTime = scanTimes.reduce((sum, time) => sum + time, 0) / scanTimes.length;
      for (const threshold of this.valueConfig.bonusThresholds.speed) {
        if (avgScanTime <= threshold.threshold) {
          bonuses.speed = this.getBaseValue(session) * threshold.bonus;
          break;
        }
      }
    }

    // Bônus de volume
    for (const threshold of this.valueConfig.bonusThresholds.volume) {
      if (totalPackages >= threshold.threshold) {
        bonuses.volume = this.getBaseValue(session) * threshold.bonus;
        break;
      }
    }

    // Bônus especial (sem divergência)
    if (!session.hasDivergence) {
      bonuses.special = this.getBaseValue(session) * 0.10;
    }

    return bonuses;
  }

  /**
   * Calcula penalidades
   */
  private calculatePenalties(session: Session): SessionFinancials['penalties'] {
    const penalties = {
      errors: 0,
      divergences: 0,
      timeouts: 0
    };

    // Penalidade por divergência
    if (session.hasDivergence) {
      const declaredCount = session.declaredCount;
      const actualCount = session.packages.length;
      const divergence = Math.abs(declaredCount - actualCount);
      penalties.divergences = divergence * this.valueConfig.penalties.divergence;
    }

    // Outras penalidades seriam calculadas baseadas em logs específicos

    return penalties;
  }

  /**
   * Calcula acurácia da sessão
   */
  private calculateAccuracy(session: Session): number {
    if (session.declaredCount === 0) return 100;
    
    const actualCount = session.packages.length;
    const accuracy = (actualCount / session.declaredCount) * 100;
    
    return Math.min(accuracy, 100);
  }

  /**
   * Obtém valor base da sessão
   */
  private getBaseValue(session: Session): number {
    return session.packages.reduce((total, pkg) => {
      return total + this.getPackageValue(pkg.type);
    }, 0);
  }

  /**
   * Obtém valor por tipo de pacote
   */
  private getPackageValue(type: PackageType): number {
    switch (type) {
      case 'shopee': return this.valueConfig.shopee;
      case 'mercado_livre': return this.valueConfig.mercadoLivre;
      case 'avulso': return this.valueConfig.avulso;
      default: return 0;
    }
  }

  /**
   * Gera resumo financeiro do operador
   */
  generateOperatorSummary(
    operatorId: string,
    sessions: Session[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): OperatorFinancialSummary {
    const filteredSessions = this.filterSessionsByPeriod(sessions, period);
    
    let totalPackages = 0;
    let totalEarnings = 0;
    let totalDuration = 0;
    let totalBonuses = 0;
    let totalPenalties = 0;
    
    const dailyData = new Map<string, { earnings: number; packages: number; }>();

    for (const session of filteredSessions) {
      const financials = this.calculateSessionFinancials(session, operatorId);
      
      totalPackages += financials.packages.total;
      totalEarnings += financials.totalValue;
      totalDuration += financials.duration;
      totalBonuses += Object.values(financials.bonuses).reduce((sum, bonus) => sum + bonus, 0);
      totalPenalties += Object.values(financials.penalties).reduce((sum, penalty) => sum + penalty, 0);

      // Agrupar por dia
      const dateKey = new Date(session.startedAt).toDateString();
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { earnings: 0, packages: 0 });
      }
      const dayData = dailyData.get(dateKey)!;
      dayData.earnings += financials.totalValue;
      dayData.packages += financials.packages.total;
    }

    // Encontrar melhor dia
    let topEarningDay = { date: Date.now(), earnings: 0, packages: 0 };
    for (const [dateStr, data] of dailyData.entries()) {
      if (data.earnings > topEarningDay.earnings) {
        topEarningDay = {
          date: new Date(dateStr).getTime(),
          earnings: data.earnings,
          packages: data.packages
        };
      }
    }

    // Calcular médias
    const averagePerSession = filteredSessions.length > 0 ? totalEarnings / filteredSessions.length : 0;
    const averageHourlyRate = totalDuration > 0 ? (totalEarnings / totalDuration) * 60 : 0;

    // Calcular taxa de crescimento (simplificado)
    const growthRate = this.calculateGrowthRate(filteredSessions);

    // Calcular eficiência
    const efficiency = totalDuration > 0 ? (totalPackages / totalDuration) * 60 : 0;

    return {
      operatorId,
      period,
      totalSessions: filteredSessions.length,
      totalPackages,
      totalEarnings,
      averagePerSession,
      averageHourlyRate,
      topEarningDay,
      bonuses: {
        accuracy: 0, // Seria calculado com dados detalhados
        speed: 0,
        volume: 0,
        special: 0,
        total: totalBonuses
      },
      deductions: {
        errors: 0,
        penalties: totalPenalties,
        total: totalPenalties
      },
      netEarnings: totalEarnings,
      growthRate,
      efficiency
    };
  }

  /**
   * Filtra sessões por período
   */
  private filterSessionsByPeriod(
    sessions: Session[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Session[] {
    const now = Date.now();
    let cutoffDate: Date;

    switch (period) {
      case 'daily':
        cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        cutoffDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return sessions.filter(session => 
      new Date(session.startedAt) >= cutoffDate
    );
  }

  /**
   * Calcula taxa de crescimento
   */
  private calculateGrowthRate(sessions: Session[]): number {
    if (sessions.length < 2) return 0;

    // Comparar primeira metade com segunda metade
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midPoint);
    const secondHalf = sessions.slice(midPoint);

    const firstHalfValue = firstHalf.reduce((sum, session) => 
      sum + session.packages.reduce((pkgSum, pkg) => pkgSum + this.getPackageValue(pkg.type), 0), 0
    );

    const secondHalfValue = secondHalf.reduce((sum, session) => 
      sum + session.packages.reduce((pkgSum, pkg) => pkgSum + this.getPackageValue(pkg.type), 0), 0
    );

    if (firstHalfValue === 0) return 0;

    return ((secondHalfValue - firstHalfValue) / firstHalfValue) * 100;
  }

  /**
   * Gera análise de ROI
   */
  generateROIAnalysis(
    sessions: Session[],
    investmentData: {
      training: number;
      equipment: number;
      software: number;
      time: number; // horas de treinamento
    }
  ): ROIAnalysis {
    const totalRevenue = sessions.reduce((sum, session) => {
      const financials = this.calculateSessionFinancials(session, '');
      return sum + financials.totalValue;
    }, 0);

    const totalPackages = sessions.reduce((sum, session) => sum + session.packages.length, 0);
    const totalTime = sessions.reduce((sum, session) => {
      const start = new Date(session.startedAt).getTime();
      const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
      return sum + (end - start);
    }, 0);

    const investment = {
      training: investmentData.training,
      equipment: investmentData.equipment,
      software: investmentData.software,
      time: investmentData.time * 50, // Valor da hora (ex: R$ 50/hora)
    };

    const totalInvestment = Object.values(investment).reduce((sum, value) => sum + value, 0);

    // Métricas de retorno
    const paybackPeriod = totalRevenue > 0 ? (totalInvestment / totalRevenue) * 30 : 0; // dias
    const roiPercentage = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    const netPresentValue = totalRevenue - totalInvestment;
    const internalRateOfReturn = roiPercentage / 100; // Simplificado

    // Projeções
    const monthlyRevenue = totalRevenue / Math.max(sessions.length / 20, 1); // Assumindo 20 sessões/mês
    const projections = {
      monthly: Array.from({ length: 12 }, (_, i) => monthlyRevenue * (i + 1)),
      yearly: Array.from({ length: 5 }, (_, i) => monthlyRevenue * 12 * (i + 1)),
      breakEvenPoint: paybackPeriod
    };

    return {
      investment,
      returns: {
        productivity: totalPackages,
        accuracy: 95, // Simplificado
        speed: totalTime > 0 ? (totalPackages / totalTime) * 3600000 : 0, // pacotes/hora
        savings: totalRevenue * 0.1 // 10% de economia estimada
      },
      metrics: {
        paybackPeriod,
        roiPercentage,
        netPresentValue,
        internalRateOfReturn
      },
      projections
    };
  }

  /**
   * Gera relatório financeiro completo
   */
  generateFinancialReport(
    sessions: Session[],
    period: { start: number; end: number },
    type: 'session' | 'operator' | 'team' | 'period' = 'period'
  ): FinancialReport {
    const filteredSessions = sessions.filter(session => {
      const sessionTime = new Date(session.startedAt).getTime();
      return sessionTime >= period.start && sessionTime <= period.end;
    });

    // Calcular resumo
    const sessionFinancials = filteredSessions.map(session => 
      this.calculateSessionFinancials(session, '')
    );

    const totalRevenue = sessionFinancials.reduce((sum, fin) => sum + fin.totalValue, 0);
    const totalCosts = sessionFinancials.reduce((sum, fin) => sum + Object.values(fin.penalties).reduce((sum, penalty) => sum + penalty, 0), 0);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const efficiency = sessionFinancials.reduce((sum, fin) => sum + fin.efficiency, 0) / sessionFinancials.length;

    // Detalhes por tipo de pacote
    const byPackageType = {
      shopee: { count: 0, value: 0 },
      mercadoLivre: { count: 0, value: 0 },
      avulso: { count: 0, value: 0 }
    };

    for (const session of filteredSessions) {
      for (const pkg of session.packages) {
        byPackageType[pkg.type as keyof typeof byPackageType].count++;
        byPackageType[pkg.type as keyof typeof byPackageType].value += this.getPackageValue(pkg.type);
      }
    }

    // Detalhes por período do dia
    const byTimeSlot = {
      morning: { revenue: 0, packages: 0 },
      afternoon: { revenue: 0, packages: 0 },
      evening: { revenue: 0, packages: 0 }
    };

    for (const session of filteredSessions) {
      const hour = new Date(session.startedAt).getHours();
      const financials = this.calculateSessionFinancials(session, '');
      
      let timeSlot: keyof typeof byTimeSlot;
      if (hour >= 6 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
      else timeSlot = 'evening';

      byTimeSlot[timeSlot].revenue += financials.totalValue;
      byTimeSlot[timeSlot].packages += financials.packages.total;
    }

    // Tendências
    const trends = {
      revenue: this.calculateTrend(filteredSessions, 'revenue'),
      efficiency: this.calculateTrend(filteredSessions, 'efficiency'),
      accuracy: this.calculateTrend(filteredSessions, 'accuracy'),
      speed: this.calculateTrend(filteredSessions, 'speed')
    };

    // Insights e recomendações
    const insights = this.generateInsights(sessionFinancials, byPackageType, byTimeSlot);
    const recommendations = this.generateRecommendations(insights, trends);

    return {
      id: `report_${Date.now()}`,
      type,
      period,
      summary: {
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        efficiency
      },
      details: {
        byOperator: [], // Seria preenchido com dados reais
        byPackageType,
        byTimeSlot
      },
      trends,
      insights,
      recommendations
    };
  }

  /**
   * Calcula tendências
   */
  private calculateTrend(sessions: Session[], metric: string): number[] {
    // Implementação simplificada - retornaria array de valores ao longo do tempo
    return sessions.map((session, index) => {
      const financials = this.calculateSessionFinancials(session, '');
      switch (metric) {
        case 'revenue': return financials.totalValue;
        case 'efficiency': return financials.efficiency;
        case 'accuracy': return this.calculateAccuracy(session);
        case 'speed': return financials.duration > 0 ? (financials.packages.total / financials.duration) * 60 : 0;
        default: return 0;
      }
    });
  }

  /**
   * Gera insights
   */
  private generateInsights(
    sessionFinancials: SessionFinancials[],
    byPackageType: { shopee: { count: number; value: number }; mercadoLivre: { count: number; value: number }; avulso: { count: number; value: number } },
    byTimeSlot: { morning: { revenue: number; packages: number }; afternoon: { revenue: number; packages: number }; evening: { revenue: number; packages: number } }
  ): string[] {
    const insights: string[] = [];

    // Insight de performance
    const avgEfficiency = sessionFinancials.reduce((sum, fin) => sum + fin.efficiency, 0) / sessionFinancials.length;
    if (avgEfficiency > 100) {
      insights.push('🚈 Excelente performance: mais de 100 pacotes/hora');
    } else if (avgEfficiency < 50) {
      insights.push('📉 Performance abaixo da média: menos de 50 pacotes/hora');
    }

    // Insight de tipo de pacote
    const dominantType = Object.entries(byPackageType)
      .sort(([, a], [, b]) => (b as any).value - (a as any).value)[0];
    insights.push(`📦 Tipo predominante: ${dominantType[0]} (${(dominantType[1] as any).value} pacotes)`);

    // Insight de período
    const bestTimeSlot = Object.entries(byTimeSlot)
      .sort(([, a], [, b]) => (b as any).revenue - (a as any).revenue)[0];
    insights.push(`⏰ Melhor período: ${bestTimeSlot[0]} (R$ ${(bestTimeSlot[1] as any).revenue.toFixed(2)})`);

    return insights;
  }

  /**
   * Gera recomendações
   */
  private generateRecommendations(insights: string[], trends: any): string[] {
    const recommendations: string[] = [];

    if (insights.some(insight => insight.includes('abaixo da média'))) {
      recommendations.push('🎯 Considere treinamento adicional para melhorar a velocidade');
    }

    if (insights.some(insight => insight.includes('Excelente performance'))) {
      recommendations.push('🏆 Mantenha o excelente trabalho e compartilhe suas melhores práticas');
    }

    return recommendations;
  }

  /**
   * Configura valores de pacotes
   */
  configurePackageValues(config: Partial<PackageValueConfig>): void {
    this.valueConfig = { ...this.valueConfig, ...config };
  }

  /**
   * Obtém configuração atual
   */
  getConfiguration(): PackageValueConfig {
    return { ...this.valueConfig };
  }

  /**
   * Calcula projeção de receita
   */
  generateRevenueProjection(
    historicalData: SessionFinancials[],
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): RevenueProjection {
    const avgSessionValue = historicalData.reduce((sum, fin) => sum + fin.totalValue, 0) / historicalData.length;
    const avgPackagesPerSession = historicalData.reduce((sum, fin) => sum + fin.packages.total, 0) / historicalData.length;

    const sessionsPerDay = 20; // Assumindo 20 sessões/dia
    const workingDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;

    const basePackages = avgPackagesPerSession * sessionsPerDay * workingDays;
    const baseRevenue = avgSessionValue * sessionsPerDay * workingDays;

    return {
      timeframe,
      scenarios: {
        conservative: {
          packages: Math.round(basePackages * 0.8),
          revenue: baseRevenue * 0.8,
          growth: -10
        },
        realistic: {
          packages: Math.round(basePackages),
          revenue: baseRevenue,
          growth: 0
        },
        optimistic: {
          packages: Math.round(basePackages * 1.2),
          revenue: baseRevenue * 1.2,
          growth: 20
        }
      },
      assumptions: {
        averagePackageValue: avgSessionValue / avgPackagesPerSession,
        accuracyRate: 95,
        speedRate: 60, // pacotes/hora
        workingDays,
        hoursPerDay: 8
      }
    };
  }
}

// Export singleton instance
export const financialService = new FinancialService();
