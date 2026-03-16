/**
 * Executive Dashboard Component
 * Dashboard executivo com métricas avançadas e visualizações de negócio
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { Session, OperatorStats } from '@/types/session';
import { enhancedAI, EnhancedPrediction } from '@/utils/enhancedAI';
import { Ionicons } from '@expo/vector-icons';
import { shouldAnimate } from '@/utils/performanceOptimizer';
import { debounce } from '@/utils/performanceOptimizer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExecutiveDashboardProps {
  sessions: Session[];
  operatorStats?: OperatorStats[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onExportReport?: () => void;
  onDrillDown?: (metric: string, value: any) => void;
}

interface ExecutiveMetrics {
  totalPackages: number;
  totalSessions: number;
  avgSessionDuration: number;
  topOperator: OperatorStats | null;
  revenueGrowth: number;
  efficiencyScore: number;
  qualityScore: number;
  customerSatisfaction: number;
}

interface KPIData {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  trend?: number[];
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  sessions,
  operatorStats = [],
  onRefresh,
  refreshing = false,
  onExportReport,
  onDrillDown,
}) => {
  const { colors } = useAppTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [aiPredictions, setAiPredictions] = useState<EnhancedPrediction[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  // Animações
  const fadeAnimation = React.useRef(new Animated.Value(0)).current;
  const slideAnimation = React.useRef(new Animated.Value(50)).current;

  // Calcula métricas executivas
  const executiveMetrics = useMemo((): ExecutiveMetrics => {
    const totalSessions = sessions.length;
    const completedSessionsArray = sessions.filter(s => s.completedAt);
    const totalPackages = sessions.reduce((sum, s) => sum + s.packages.length, 0);

    // Duração média das sessões
    const durations = completedSessionsArray.map((s: Session) => {
      const start = new Date(s.startedAt).getTime();
      const end = new Date(s.completedAt!).getTime();
      return (end - start) / (1000 * 60); // minutos
    });
    const avgSessionDuration = durations.length > 0 
      ? durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length 
      : 0;

    // Melhor operador
    const topOperator = operatorStats.length > 0
      ? operatorStats.reduce((best, current) => 
          current.avgRatePerMinute > best.avgRatePerMinute ? current : best
        )
      : null;

    // Taxa de crescimento (simulação)
    const revenueGrowth = 12.5; // % em relação ao período anterior

    // Scores (simulações baseadas em dados)
    const efficiencyScore = Math.min(100, (totalPackages / Math.max(totalSessions, 1)) * 2);
    const qualityScore = Math.max(0, 100 - (sessions.filter(s => s.hasDivergence).length / Math.max(totalSessions, 1)) * 100);
    const customerSatisfaction = 92.3; // Simulação

    return {
      totalPackages,
      totalSessions,
      avgSessionDuration,
      topOperator,
      revenueGrowth,
      efficiencyScore,
      qualityScore,
      customerSatisfaction,
    };
  }, [sessions, operatorStats]);

  // Dados para KPIs
  const kpiData: KPIData[] = useMemo(() => [
    {
      title: 'Pacotes Processados',
      value: executiveMetrics.totalPackages.toLocaleString('pt-BR'),
      change: 8.3,
      changeType: 'increase',
      icon: 'package-outline',
      color: '#FF6B6B',
      trend: [50, 55, 52, 58, 62, 65, 68],
    },
    {
      title: 'Eficiência Operacional',
      value: `${Math.round(executiveMetrics.efficiencyScore)}%`,
      change: 5.2,
      changeType: 'increase',
      icon: 'trending-up-outline',
      color: '#45B7D1',
      trend: [85, 87, 86, 89, 91, 92, 94],
    },
    {
      title: 'Taxa de Divergência',
      value: `${Math.round(100 - executiveMetrics.qualityScore)}%`,
      change: -1.2,
      changeType: 'decrease',
      icon: 'alert-circle-outline',
      color: '#FFD93D',
      trend: [5, 4.8, 5.2, 4.5, 4.3, 4.0, 3.8],
    },
    {
      title: 'Satisfação Cliente',
      value: `${executiveMetrics.customerSatisfaction}%`,
      change: 3.7,
      changeType: 'increase',
      icon: 'happy-outline',
      color: '#FFA500',
      trend: [88, 89, 90, 91, 91, 92, 92],
    },
    {
      title: 'Qualidade',
      value: `${Math.round(executiveMetrics.qualityScore)}%`,
      change: 1.8,
      changeType: 'increase',
      icon: 'shield-checkmark-outline',
      color: '#9B59B6',
      trend: [90, 91, 92, 91, 93, 94, 95],
    },
  ], [executiveMetrics]);

  // Carrega predições da IA
  useEffect(() => {
    const loadAIPredictions = async () => {
      if (sessions.length > 0 && enhancedAI.isReady()) {
        try {
          const latestSession = sessions[sessions.length - 1];
          const sessionData = {
            sessionId: latestSession.id,
            operatorId: latestSession.operatorName,
            packages: latestSession.packages,
            startTime: new Date(latestSession.startedAt).getTime(),
            currentTime: Date.now(),
            scanRate: 15, // Simulação
            errorRate: 0.05, // Simulação
            packageDistribution: { shopee: 40, mercado_livre: 35, avulso: 15, unknown: 10 },
          };

          const predictions = await Promise.all([
            enhancedAI.predictDivergence(sessionData),
          ]);

          setAiPredictions(predictions);
        } catch (error) {
          console.error('Error loading AI predictions:', error);
        }
      }
    };

    loadAIPredictions();
  }, [sessions]);

  // Animação de entrada
  useEffect(() => {
    if (shouldAnimate()) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnimation, slideAnimation]);

  // Handler para drill down
  const handleKPIDrillDown = useCallback((kpiTitle: string, value: any) => {
    setSelectedKPI(kpiTitle);
    onDrillDown?.(kpiTitle, value);
    setShowDetailedView(true);
  }, [onDrillDown]);

  // Handler para mudança de período
  const handlePeriodChange = useCallback((period: typeof selectedPeriod) => {
    setSelectedPeriod(period);
    onRefresh?.();
  }, [onRefresh]);

  // Renderiza KPI card
  const renderKPICard = (kpi: KPIData, index: number) => {
    const cardStyle = [
      styles.kpiCard,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        opacity: fadeAnimation,
        transform: [
          {
            translateY: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      },
    ];

    const changeColor = kpi.changeType === 'increase' ? '#4ECDC4' : 
                       kpi.changeType === 'decrease' ? '#FF6B6B' : colors.secondary;

    return (
      <Animated.View key={kpi.title} style={cardStyle}>
        <TouchableOpacity
          onPress={() => handleKPIDrillDown(kpi.title, kpi.value)}
          activeOpacity={0.7}
        >
          <View style={styles.kpiHeader}>
            <View style={[styles.kpiIconContainer, { backgroundColor: kpi.color + '20' }]}>
              <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
            </View>
            {kpi.change !== undefined && (
              <View style={styles.changeContainer}>
                <Ionicons 
                  name={kpi.changeType === 'increase' ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={changeColor} 
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {Math.abs(kpi.change)}%
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {kpi.value}
          </Text>
          
          <Text style={[styles.kpiTitle, { color: colors.secondary }]}>
            {kpi.title}
          </Text>

          {/* Mini gráfico de tendência */}
          {kpi.trend && kpi.trend.length > 0 && (
            <View style={styles.miniTrendContainer}>
              {kpi.trend.map((value: number, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.trendBar,
                    {
                      height: (value / 100) * 20,
                      backgroundColor: kpi.color,
                      opacity: 0.3 + (i / kpi.trend!.length) * 0.7,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Renderiza insights da IA
  const renderAIInsights = () => (
    <View style={[styles.insightsContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🤖 Insights da IA
      </Text>
      
      {aiPredictions.length > 0 ? (
        aiPredictions.map((prediction, index) => (
          <View key={index} style={[styles.insightCard, { borderColor: colors.border }]}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightType, { color: colors.primary }]}>
                {prediction.type === 'divergence' ? '⚠️ Risco de Divergência' : 
                 prediction.type === 'efficiency' ? '⚡ Otimização' : '📊 Análise'}
              </Text>
              <Text style={[styles.insightConfidence, { color: colors.secondary }]}>
                Confiança: {Math.round(prediction.confidence * 100)}%
              </Text>
            </View>
            
            <Text style={[styles.insightDescription, { color: colors.text }]}>
              {prediction.prediction?.probability ? 
                `Probabilidade de ${(prediction.prediction.probability * 100).toFixed(1)}%` :
                'Análise em andamento...'
              }
            </Text>
            
            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <View style={styles.recommendationsContainer}>
                {prediction.recommendations.slice(0, 2).map((rec, i) => (
                  <Text key={i} style={[styles.recommendation, { color: colors.secondary }]}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={[styles.noInsightsText, { color: colors.secondary }]}>
          Aguardando dados para análise...
        </Text>
      )}
    </View>
  );

  // Renderiza seletor de período
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['day', 'week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            {
              backgroundColor: selectedPeriod === period ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => handlePeriodChange(period)}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === period ? '#fff' : colors.text },
          ]}>
            {period === 'day' ? 'Dia' : 
             period === 'week' ? 'Semana' : 
             period === 'month' ? 'Mês' : 'Ano'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          📊 Dashboard Executivo
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={onExportReport}
          >
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Exportar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seletor de Período */}
      {renderPeriodSelector()}

      {/* KPIs Grid */}
      <View style={styles.kpiGrid}>
        {kpiData.map((kpi, index) => renderKPICard(kpi, index))}
      </View>

      {/* Insights da IA */}
      {renderAIInsights()}

      {/* Top Performers */}
      {operatorStats.length > 0 && (
        <View style={[styles.performersContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🏆 Top Performers
          </Text>
          
          {operatorStats.slice(0, 3).map((operator, index) => (
            <View key={operator.name} style={[styles.performerCard, { borderColor: colors.border }]}>
              <View style={styles.performerRank}>
                <Text style={[styles.rankText, { color: colors.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              
              <View style={styles.performerInfo}>
                <Text style={[styles.performerName, { color: colors.text }]}>
                  {operator.name}
                </Text>
                <Text style={[styles.performerStats, { color: colors.secondary }]}>
                  {operator.totalPackages} pacotes • {operator.avgRatePerMinute.toFixed(1)}/min
                </Text>
              </View>
              
              <View style={styles.performerScore}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>
                  {Math.round(operator.accuracyScore)}%
                </Text>
                <Text style={[styles.scoreLabel, { color: colors.secondary }]}>
                  Acurácia
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Resumo Operacional */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📈 Resumo Operacional
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {executiveMetrics.totalSessions}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              Sessões Hoje
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {Math.round(executiveMetrics.avgSessionDuration)}min
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
              Duração Média
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  miniTrendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    gap: 2,
  },
  trendBar: {
    flex: 1,
    minWidth: 3,
    borderRadius: 2,
  },
  insightsContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightType: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightConfidence: {
    fontSize: 12,
  },
  insightDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  recommendationsContainer: {
    gap: 4,
  },
  recommendation: {
    fontSize: 12,
  },
  noInsightsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  performersContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  performerRank: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  performerStats: {
    fontSize: 12,
  },
  performerScore: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
  },
  summaryContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ExecutiveDashboard;
