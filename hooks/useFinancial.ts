/**
 * Hook for Financial System
 * Hook React para sistema financeiro e ROI
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FinancialMetrics,
  SessionFinancials,
  OperatorFinancialSummary,
  ROIAnalysis,
  FinancialReport,
  RevenueProjection,
  FinancialKPI
} from '@/types/financial';
import { Session } from '@/types/session';
import { financialService } from '@/services/financialService';

interface UseFinancialOptions {
  operatorId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface FinancialState {
  currentSession: SessionFinancials | null;
  operatorSummary: OperatorFinancialSummary | null;
  roiAnalysis: ROIAnalysis | null;
  financialReport: FinancialReport | null;
  revenueProjection: RevenueProjection | null;
  kpis: FinancialKPI[];
  isLoading: boolean;
  error: string | null;
}

export function useFinancial({
  operatorId,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minuto
}: UseFinancialOptions) {
  const [state, setState] = useState<FinancialState>({
    currentSession: null,
    operatorSummary: null,
    roiAnalysis: null,
    financialReport: null,
    revenueProjection: null,
    kpis: [],
    isLoading: true,
    error: null,
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadFinancialData();
  }, [operatorId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadFinancialData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, operatorId]);

  // Carregar dados financeiros
  const loadFinancialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Aqui você carregaria os dados reais do backend
      // Por enquanto, vamos usar dados simulados
      
      setState({
        currentSession: null,
        operatorSummary: null,
        roiAnalysis: null,
        financialReport: null,
        revenueProjection: null,
        kpis: generateMockKPIs(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados financeiros',
      }));
    }
  }, [operatorId]);

  // Calcular métricas da sessão atual
  const calculateSessionMetrics = useCallback((
    session: Session,
    scanTimes: number[] = []
  ) => {
    try {
      const financials = financialService.calculateSessionFinancials(
        session,
        operatorId,
        scanTimes
      );

      setState(prev => ({ ...prev, currentSession: financials }));
      return financials;
    } catch (error) {
      console.error('Error calculating session metrics:', error);
      return null;
    }
  }, [operatorId]);

  // Gerar resumo do operador
  const generateOperatorSummary = useCallback((
    sessions: Session[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ) => {
    try {
      const summary = financialService.generateOperatorSummary(
        operatorId,
        sessions,
        period
      );

      setState(prev => ({ ...prev, operatorSummary: summary }));
      return summary;
    } catch (error) {
      console.error('Error generating operator summary:', error);
      return null;
    }
  }, [operatorId]);

  // Gerar análise de ROI
  const generateROIAnalysis = useCallback((
    sessions: Session[],
    investmentData: {
      training: number;
      equipment: number;
      software: number;
      time: number;
    }
  ) => {
    try {
      const analysis = financialService.generateROIAnalysis(sessions, investmentData);

      setState(prev => ({ ...prev, roiAnalysis: analysis }));
      return analysis;
    } catch (error) {
      console.error('Error generating ROI analysis:', error);
      return null;
    }
  }, []);

  // Gerar relatório financeiro
  const generateFinancialReport = useCallback((
    sessions: Session[],
    period: { start: number; end: number },
    type: 'session' | 'operator' | 'team' | 'period' = 'period'
  ) => {
    try {
      const report = financialService.generateFinancialReport(sessions, period, type);

      setState(prev => ({ ...prev, financialReport: report }));
      return report;
    } catch (error) {
      console.error('Error generating financial report:', error);
      return null;
    }
  }, []);

  // Gerar projeção de receita
  const generateRevenueProjection = useCallback((
    historicalData: SessionFinancials[],
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) => {
    try {
      const projection = financialService.generateRevenueProjection(
        historicalData,
        timeframe
      );

      setState(prev => ({ ...prev, revenueProjection: projection }));
      return projection;
    } catch (error) {
      console.error('Error generating revenue projection:', error);
      return null;
    }
  }, []);

  // Formatar moeda
  const formatCurrency = useCallback((amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  }, []);

  // Formatar percentual
  const formatPercentage = useCallback((value: number, decimals: number = 1) => {
    return `${value.toFixed(decimals)}%`;
  }, []);

  // Calcular crescimento
  const calculateGrowth = useCallback((current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  // Obter cor de métrica
  const getMetricColor = useCallback((value: number, target: number) => {
    const percentage = (value / target) * 100;
    
    if (percentage >= 100) return '#10b981'; // verde
    if (percentage >= 80) return '#f59e0b'; // amarelo
    return '#ef4444'; // vermelho
  }, []);

  // Obter status da métrica
  const getMetricStatus = useCallback((value: number, target: number) => {
    const percentage = (value / target) * 100;
    
    if (percentage >= 100) return 'good';
    if (percentage >= 80) return 'warning';
    return 'critical';
  }, []);

  // Gerar KPIs simulados
  const generateMockKPIs = useCallback((): FinancialKPI[] => {
    return [
      {
        name: 'Receita Mensal',
        value: 12500,
        target: 10000,
        unit: 'R$',
        trend: 'up',
        change: 2500,
        changePercent: 25,
        status: 'good',
      },
      {
        name: 'Taxa Horária',
        value: 85,
        target: 75,
        unit: 'R$/h',
        trend: 'up',
        change: 10,
        changePercent: 13.3,
        status: 'good',
      },
      {
        name: 'Eficiência',
        value: 92,
        target: 90,
        unit: 'pac/h',
        trend: 'stable',
        change: 0,
        changePercent: 0,
        status: 'good',
      },
      {
        name: 'ROI',
        value: 145,
        target: 100,
        unit: '%',
        trend: 'up',
        change: 15,
        changePercent: 11.5,
        status: 'good',
      },
    ];
  }, []);

  // Obter insights financeiros
  const getFinancialInsights = useCallback(() => {
    const insights = [];

    if (state.currentSession) {
      const session = state.currentSession;
      
      if (session.totalValue > 100) {
        insights.push('💰 Ótima sessão! Valor acima da média');
      }
      
      if (session.hourlyRate > 80) {
        insights.push('⚡ Excelente taxa horária!');
      }
      
      if (session.bonuses.accuracy > 0) {
        insights.push('🎯 Bônus de precisão conquistado!');
      }
    }

    if (state.operatorSummary) {
      const summary = state.operatorSummary;
      
      if (summary.growthRate > 10) {
        insights.push('📈 Crescimento impressionante este mês!');
      }
      
      if (summary.efficiency > 100) {
        insights.push('🚀 Eficiência excepcional!');
      }
    }

    return insights;
  }, [state]);

  // Obter recomendações financeiras
  const getFinancialRecommendations = useCallback(() => {
    const recommendations = [];

    if (state.currentSession) {
      const session = state.currentSession;
      
      if (session.penalties.errors > 0) {
        recommendations.push('📚 Reduza erros para aumentar ganhos');
      }
      
      if (session.efficiency < 50) {
        recommendations.push('⚡ Aumente a velocidade de escaneamento');
      }
    }

    if (state.operatorSummary) {
      const summary = state.operatorSummary;
      
      if (summary.netEarnings < 5000) {
        recommendations.push('🎯 Estabeleça metas diárias mais altas');
      }
      
      if (summary.deductions.total > summary.bonuses.total * 0.2) {
        recommendations.push('⚠️ Penalidades estão impactando seus ganhos');
      }
    }

    return recommendations;
  }, [state]);

  return {
    // Estado
    ...state,

    // Métodos
    loadFinancialData,
    calculateSessionMetrics,
    generateOperatorSummary,
    generateROIAnalysis,
    generateFinancialReport,
    generateRevenueProjection,

    // Utilitários
    formatCurrency,
    formatPercentage,
    calculateGrowth,
    getMetricColor,
    getMetricStatus,
    getFinancialInsights,
    getFinancialRecommendations,

    // Refresh
    refresh: loadFinancialData,
  };
}
