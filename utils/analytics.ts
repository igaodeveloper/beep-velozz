import { Session } from '@/types/session';
import { getSessionMetrics } from './session';

export interface OperatorStats {
  name: string;
  totalSessions: number;
  totalPackages: number;
  avgRatePerMinute: number;
  errorRate: number;
  avgResponseTime: number;
  preferredMarketplace: string;
  accuracyScore: number;
}

/**
 * Calcula estatísticas avançadas de um operador
 */
export function calculateOperatorStats(sessions: Session[]): OperatorStats[] {
  const operatorMap = new Map<string, Session[]>();

  // Agrupar sessões por operador
  sessions.forEach((session) => {
    const current = operatorMap.get(session.operatorName) || [];
    operatorMap.set(session.operatorName, [...current, session]);
  });

  // Calcular estatísticas para cada operador
  return Array.from(operatorMap.entries()).map(([operatorName, operatorSessions]) => {
    const totalSessions = operatorSessions.length;
    const totalPackages = operatorSessions.reduce((sum, s) => sum + s.packages.length, 0);
    const divergenceSessions = operatorSessions.filter((s) => s.hasDivergence).length;
    const errorRate = totalSessions > 0 ? (divergenceSessions / totalSessions) * 100 : 0;

    // Calcular velocidade média (pacotes por minuto)
    const durations = operatorSessions
      .filter((s) => s.completedAt)
      .map((s) => {
        const start = new Date(s.startedAt).getTime();
        const end = new Date(s.completedAt!).getTime();
        return (end - start) / 1000 / 60; // em minutos
      });

    const avgResponseTime = durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0;
    const avgRatePerMinute = avgResponseTime > 0 ? totalPackages / durations.length / avgResponseTime : 0;

    // Determinar marketplace preferido
    const marketplaceCount = { shopee: 0, mercado_livre: 0, avulso: 0 };
    operatorSessions.forEach((s) => {
      const metrics = getSessionMetrics(s.packages);
      marketplaceCount.shopee += metrics.shopee;
      marketplaceCount.mercado_livre += metrics.mercadoLivre;
      marketplaceCount.avulso += metrics.avulsos;
    });

    const preferredMarketplace = (
      Object.entries(marketplaceCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'shopee'
    ) as any;

    // Score de acurácia: 100 - (errorRate + outliers)
    const accuracyScore = Math.max(0, Math.min(100, 100 - errorRate));

    return {
      name: operatorName,
      totalSessions,
      totalPackages,
      avgRatePerMinute: Math.round(avgRatePerMinute * 100) / 100,
      errorRate: Math.round(errorRate * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      preferredMarketplace,
      accuracyScore: Math.round(accuracyScore * 10) / 10,
    };
  });
}

/**
 * Detecta anomalias em uma sessão (taxa de divergência anormal, velocidade fora do padrão, etc)
 */
export function detectAnomalies(session: Session, historicalSessions: Session[]): {
  score: number; // 0-1
  flags: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const flags: string[] = [];
  let score = 0;

  if (historicalSessions.length === 0) {
    return { score: 0, flags: [], severity: 'low' };
  }

  const sessionMetrics = getSessionMetrics(session.packages);
  const divergenceRate = session.declaredCount > 0
    ? Math.abs(session.packages.length - session.declaredCount) / session.declaredCount
    : 0;

  // Calcular estatísticas de divergência do histórico
  const historicalDivergences = historicalSessions
    .filter((s) => s.declaredCount > 0)
    .map((s) => Math.abs(s.packages.length - s.declaredCount) / s.declaredCount);

  const avgDivergence = historicalDivergences.length > 0
    ? historicalDivergences.reduce((a, b) => a + b) / historicalDivergences.length
    : 0;
  const stdDevDivergence = calculateStdDev(historicalDivergences);

  // Flag: divergência muito acima do padrão
  if (divergenceRate > avgDivergence + stdDevDivergence * 2) {
    flags.push(`Divergência anormalmente alta (${(divergenceRate * 100).toFixed(1)}%)`);
    score += 0.4;
  }

  // Calcular velocidade (pacotes por minuto)
  if (session.completedAt) {
    const durationMinutes = (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60;
    const ratePerMinute = session.packages.length / durationMinutes;

    const historicalRates = historicalSessions
      .filter((s) => s.completedAt)
      .map((s) => {
        const duration = (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / 1000 / 60;
        return s.packages.length / duration;
      });

    const avgRate = historicalRates.length > 0 ? historicalRates.reduce((a, b) => a + b) / historicalRates.length : 0;
    const stdDevRate = calculateStdDev(historicalRates);

    // Flag: velocidade muito diferente do padrão
    if (ratePerMinute > avgRate + stdDevRate * 2 || ratePerMinute < avgRate - stdDevRate * 2) {
      flags.push(`Velocidade anormal (${ratePerMinute.toFixed(2)} pkg/min vs ${avgRate.toFixed(2)} esperado)`);
      score += 0.3;
    }
  }

  // Flag: quantidade de pacotes muito fora do esperado
  const historicalCounts = historicalSessions.map((s) => getSessionMetrics(s.packages).total);
  const avgCount = historicalCounts.length > 0 ? historicalCounts.reduce((a, b) => a + b) / historicalCounts.length : 0;
  const stdDevCount = calculateStdDev(historicalCounts);

  if (Math.abs(sessionMetrics.total - avgCount) > stdDevCount * 2.5) {
    flags.push(`Quantidade de pacotes anômala (${sessionMetrics.total} vs ${Math.round(avgCount)} esperado)`);
    score += 0.3;
  }

  const severity = score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low';

  return {
    score: Math.min(1, score),
    flags,
    severity,
  };
}

/**
 * Calcula previsão de tempo de conclusão baseado na velocidade atual
 */
export function estimateCompletionTime(
  packagesScanned: number,
  packagesRemaining: number,
  historicalSessions: Session[]
): number {
  if (historicalSessions.length === 0 || packagesRemaining === 0) {
    // Assumir 10 pacotes por minuto como padrão
    return packagesRemaining / 10;
  }

  // Calcular velocidade histórica média
  const rates = historicalSessions
    .filter((s) => s.completedAt && s.packages.length > 0)
    .map((s) => {
      const duration = (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / 1000 / 60;
      return s.packages.length / duration;
    });

  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b) / rates.length : 10;
  return packagesRemaining / avgRate;
}

/**
 * Gera insights sobre o desempenho
 */
export function generateInsights(sessions: Session[]): string[] {
  const insights: string[] = [];

  if (sessions.length === 0) {
    return ['Nenhum dado de histórico disponível'];
  }

  // Insight 1: Marketplace mais conferenciado
  const allMetrics = sessions.map((s) => getSessionMetrics(s.packages));
  const totalShopee = allMetrics.reduce((sum, m) => sum + m.shopee, 0);
  const totalML = allMetrics.reduce((sum, m) => sum + m.mercadoLivre, 0);
  const totalAvulso = allMetrics.reduce((sum, m) => sum + m.avulsos, 0);

  const total = totalShopee + totalML + totalAvulso;
  if (total > 0) {
    const shopeePercent = ((totalShopee / total) * 100).toFixed(0);
    insights.push(`📊 Shopee representa ${shopeePercent}% do volume conferenciado`);
  }

  // Insight 2: Taxa de divergência
  const divergenceSessions = sessions.filter((s) => s.hasDivergence).length;
  const divergenceRate = ((divergenceSessions / sessions.length) * 100).toFixed(1);
  if (divergenceRate === '0.0') {
    insights.push('✅ Perfeito! Nenhuma divergência nos últimas sessões');
  } else if (parseFloat(divergenceRate) > 20) {
    insights.push(`⚠️ Taxa de divergência alta: ${divergenceRate}%`);
  } else {
    insights.push(`📈 Taxa de divergência controlada: ${divergenceRate}%`);
  }

  // Insight 3: Operador mais rápido
  const operatorStats = calculateOperatorStats(sessions);
  if (operatorStats.length > 1) {
    const fastest = operatorStats.reduce((a, b) => (a.avgRatePerMinute > b.avgRatePerMinute ? a : b));
    insights.push(`⚡ ${fastest.name} é o operador mais ágil (${fastest.avgRatePerMinute} pkg/min)`);
  }

  // Insight 4: Total de pacotes processados
  const totalPackages = allMetrics.reduce((sum, m) => sum + m.total, 0);
  insights.push(`� ${totalPackages} pacotes processados em ${sessions.length} sessões`);

  return insights;
}

/**
 * Utilitário para calcular desvio padrão
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Gera relatório de performance comparativo
 */
export function generatePerformanceReport(sessions: Session[]): {
  summary: string;
  metrics: Record<string, string>;
  warnings: string[];
} {
  const metrics = sessions.map((s) => getSessionMetrics(s.packages));
  const operatorStats = calculateOperatorStats(sessions);

  const totalPackages = metrics.reduce((sum, m) => sum + m.total, 0);
  const divergenceSessions = sessions.filter((s) => s.hasDivergence).length;

  const summary = `Conferência de ${totalPackages} pacotes em ${sessions.length} sessões`;

  const metricsObj: Record<string, string> = {
    'Total de Sessões': sessions.length.toString(),
    'Pacotes Conferenciados': totalPackages.toString(),
    'Sessões com Divergência': divergenceSessions.toString(),
    'Taxa de Divergência': `${((divergenceSessions / sessions.length) * 100).toFixed(1)}%`,
    'Melhor Operador':
      operatorStats.length > 0
        ? `${operatorStats[0].name} (${operatorStats[0].accuracyScore}% acurácia)`
        : 'N/A',
  };

  const warnings: string[] = [];
  if (operatorStats.some((s) => s.errorRate > 15)) {
    warnings.push('⚠️ Alguns operadores com taxa de erro elevada');
  }

  return { summary, metrics: metricsObj, warnings };
}
