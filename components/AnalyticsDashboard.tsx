/**
 * Analytics Dashboard - Tempo Real
 * Dashboard premium com visualizações avançadas e insights inteligentes
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { analyticsService } from '@/services/analyticsService';
import { cacheService } from '@/services/cacheService';
import { smartClassifier } from '@/services/smartClassifierService';

interface DashboardData {
  realTimeStats: any;
  sessionHistory: any[];
  performanceReport: any;
  cacheStats: any;
  mlMetrics: any;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day' | 'week'>('day');
  
  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadDashboardData();
    startRealTimeUpdates();
    
    // Animação inicial
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [realTimeStats, sessionHistory, performanceReport, cacheStats, mlMetrics] = 
        await Promise.all([
          analyticsService.getRealTimeStats(),
          analyticsService.getSessionHistory(10),
          analyticsService.getPerformanceReport(selectedTimeRange),
          cacheService.getStats(),
          smartClassifier.getModelMetrics(),
        ]);

      setData({
        realTimeStats,
        sessionHistory,
        performanceReport,
        cacheStats,
        mlMetrics,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    const interval = setInterval(async () => {
      if (!loading) {
        const realTimeStats = await analyticsService.getRealTimeStats();
        setData(prev => prev ? { ...prev, realTimeStats } : null);
      }
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderMetricCard = (metric: MetricCard, index: number) => {
    const delay = index * 100;
    
    return (
      <Animated.View
        style={[
          styles.metricCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={20} style={styles.cardBlur}>
          <LinearGradient
            colors={metric.color ? [metric.color + '20', metric.color + '10'] : ['#667EEA20', '#764BA210']}
            style={styles.cardGradient}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{metric.title}</Text>
            <Text style={[styles.cardValue, { color: metric.color || '#667EEA' }]}>
              {metric.value}
            </Text>
            {metric.change !== undefined && (
              <View style={styles.trendContainer}>
                <Text style={[
                  styles.trendText,
                  { color: metric.trend === 'up' ? '#48BB78' : metric.trend === 'down' ? '#F56565' : '#718096' }
                ]}>
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}{metric.change}%
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  const renderPerformanceChart = () => {
    if (!data?.performanceReport) return null;

    const chartData = {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [{
        data: [30, 45, 60, 70, 85, 75],
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        strokeWidth: 2,
      }],
    };

    return (
      <Animated.View style={[styles.chartContainer, { opacity: fadeAnim }]}>
        <Text style={styles.chartTitle}>Performance ao Longo do Tempo</Text>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: '#1a202c',
            backgroundGradientTo: '#2d3748',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#667EEA',
            },
          }}
          bezier
          style={styles.chart}
        />
      </Animated.View>
    );
  };

  const renderPackageDistributionChart = () => {
    if (!data?.realTimeStats) return null;

    const packageData = data.realTimeStats.packageDistribution;
    const chartData = [
      {
        name: 'Shopee',
        population: packageData.shopee || 0,
        color: '#FF6B35',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      },
      {
        name: 'Mercado Livre',
        population: packageData.mercado_livre || 0,
        color: '#667EEA',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      },
      {
        name: 'Avulso',
        population: packageData.avulso || 0,
        color: '#48BB78',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      },
      {
        name: 'Desconhecido',
        population: packageData.unknown || 0,
        color: '#718096',
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      },
    ];

    return (
      <Animated.View style={[styles.chartContainer, { opacity: fadeAnim }]}>
        <Text style={styles.chartTitle}>Distribuição de Pacotes</Text>
        <PieChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: '#1a202c',
            backgroundGradientTo: '#2d3748',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
          style={styles.chart}
        />
      </Animated.View>
    );
  };

  const renderSystemHealth = () => {
    if (!data) return null;

    const healthScore = data.realTimeStats.performanceScore;
    const systemHealth = data.realTimeStats.systemHealth;
    
    const getHealthColor = (health: string) => {
      switch (health) {
        case 'excellent': return '#48BB78';
        case 'good': return '#667EEA';
        case 'warning': return '#F6AD55';
        case 'critical': return '#F56565';
        default: return '#718096';
      }
    };

    const getHealthIcon = (health: string) => {
      switch (health) {
        case 'excellent': return 'excellent';
        case 'good': return 'good';
        case 'warning': return 'warning';
        case 'critical': return 'critical';
        default: return 'unknown';
      }
    };

    return (
      <Animated.View style={[styles.healthContainer, { opacity: fadeAnim }]}>
        <Text style={styles.healthTitle}>Saúde do Sistema</Text>
        <View style={styles.healthScore}>
          <View style={[
            styles.healthCircle,
            { backgroundColor: getHealthColor(systemHealth) }
          ]}>
            <Text style={styles.healthScoreText}>{Math.round(healthScore)}</Text>
          </View>
          <Text style={styles.healthStatus}>{systemHealth.toUpperCase()}</Text>
        </View>
        
        <View style={styles.healthMetrics}>
          <View style={styles.healthMetric}>
            <Text style={styles.healthMetricLabel}>Cache Hit Rate</Text>
            <Text style={styles.healthMetricValue}>
              {Math.round(data.cacheStats.hitRate)}%
            </Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={styles.healthMetricLabel}>ML Accuracy</Text>
            <Text style={styles.healthMetricValue}>
              {Math.round(data.mlMetrics.accuracy * 100)}%
            </Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={styles.healthMetricLabel}>Memory Usage</Text>
            <Text style={styles.healthMetricValue}>
              {Math.round(data.cacheStats.memoryUsage / 1024 / 1024)}MB
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTopOperators = () => {
    if (!data?.realTimeStats?.topOperators) return null;

    return (
      <Animated.View style={[styles.operatorsContainer, { opacity: fadeAnim }]}>
        <Text style={styles.operatorsTitle}>Top Operadores</Text>
        {data.realTimeStats.topOperators.map((operator: any, index: number) => (
          <View key={operator.name} style={styles.operatorItem}>
            <View style={styles.operatorRank}>
              <Text style={styles.operatorRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.operatorInfo}>
              <Text style={styles.operatorName}>{operator.name}</Text>
              <Text style={styles.operatorScans}>{operator.scans} scans</Text>
            </View>
            <View style={styles.operatorEfficiency}>
              <Text style={styles.operatorEfficiencyText}>
                {operator.efficiency}%
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderInsights = () => {
    if (!data?.realTimeStats?.insights) return null;

    return (
      <Animated.View style={[styles.insightsContainer, { opacity: fadeAnim }]}>
        <Text style={styles.insightsTitle}>Insights Inteligentes</Text>
        {data.realTimeStats.insights.map((insight: string, index: number) => (
          <View key={index} style={styles.insightItem}>
            <View style={styles.insightBullet} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  const metrics: MetricCard[] = data ? [
    {
      title: 'Scans Hoje',
      value: data.realTimeStats.totalScansToday,
      change: 12,
      trend: 'up',
      color: '#667EEA',
    },
    {
      title: 'Sessões Ativas',
      value: data.realTimeStats.activeSessions,
      change: -5,
      trend: 'down',
      color: '#FF6B35',
    },
    {
      title: 'Performance',
      value: `${Math.round(data.realTimeStats.performanceScore)}%`,
      change: 8,
      trend: 'up',
      color: '#48BB78',
    },
    {
      title: 'Cache Hit Rate',
      value: `${Math.round(data.cacheStats.hitRate)}%`,
      change: 3,
      trend: 'stable',
      color: '#F6AD55',
    },
  ] : [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667EEA" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>Tempo real - {new Date().toLocaleTimeString()}</Text>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => renderMetricCard(metric, index))}
      </View>

      {/* Charts */}
      {renderPerformanceChart()}
      {renderPackageDistributionChart()}

      {/* System Health */}
      {renderSystemHealth()}

      {/* Top Operators */}
      {renderTopOperators()}

      {/* Insights */}
      {renderInsights()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a202c',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    height: 120,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    borderRadius: 16,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendContainer: {
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d3748',
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  healthContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d3748',
    borderRadius: 16,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  healthCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthScoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthMetricLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  healthMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  operatorsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d3748',
    borderRadius: 16,
  },
  operatorsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  operatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  operatorRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667EEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  operatorRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  operatorScans: {
    fontSize: 12,
    color: '#718096',
  },
  operatorEfficiency: {
    backgroundColor: '#48BB78',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  operatorEfficiencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d3748',
    borderRadius: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667EEA',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
});

export default AnalyticsDashboard;
