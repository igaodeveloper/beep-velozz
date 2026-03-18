/**
 * Intelligent Dashboard Component
 * Dashboard inteligente com insights em tempo real e visualizações avançadas
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { Session, OperatorStats } from '@/types/session';
import { aiPatternRecognition, PatternInsight } from '@/utils/aiPatternRecognition';
import { smartNotificationManager, SmartNotification } from '@/utils/smartNotifications';
import { packageImageRecognition, ImageAnalysisResult } from '@/utils/imageRecognition';
import { packageAPIIntegration } from '@/utils/apiIntegration';

const { width: screenWidth } = Dimensions.get('window');

interface IntelligentDashboardProps {
  sessions: Session[];
  currentSession?: Session;
  onSessionSelect?: (session: Session) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function IntelligentDashboard({
  sessions,
  currentSession,
  onSessionSelect,
  onRefresh,
  refreshing = false,
}: IntelligentDashboardProps) {
  const { colors } = useAppTheme();
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [imageStats, setImageStats] = useState(packageImageRecognition.getAnalysisStats());
  const [apiStats, setApiStats] = useState(packageAPIIntegration.getAPIStats());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'performance' | 'quality'>('overview');

  // Carrega insights da IA
  useEffect(() => {
    if (currentSession) {
      aiPatternRecognition.analyzeSession(currentSession, sessions).then(setInsights);
    }
  }, [currentSession, sessions]);

  // Carrega notificações
  useEffect(() => {
    setNotifications(smartNotificationManager.getNotificationHistory());
  }, []);

  // Atualiza estatísticas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setImageStats(packageImageRecognition.getAnalysisStats());
      setApiStats(packageAPIIntegration.getAPIStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calcula métricas derivadas
  const metrics = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completedAt).length;
    const divergentSessions = sessions.filter(s => s.hasDivergence).length;
    const totalPackages = sessions.reduce((sum, s) => sum + s.packages.length, 0);
    const totalValue = sessions.reduce((sum, s) => {
      return sum + s.packages.reduce((pkgSum, pkg) => pkgSum + (pkg.value || 0), 0);
    }, 0);

    const divergenceRate = completedSessions > 0 ? (divergentSessions / completedSessions) * 100 : 0;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const avgPackagesPerSession = completedSessions > 0 ? totalPackages / completedSessions : 0;

    return {
      totalSessions,
      completedSessions,
      divergentSessions,
      totalPackages,
      totalValue,
      divergenceRate,
      completionRate,
      avgPackagesPerSession,
    };
  }, [sessions]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Gráfico de linhas - Pacotes por dia
    const last7Days = sessions
      .filter(s => s.completedAt)
      .slice(-7)
      .map(s => ({
        day: new Date(s.startedAt).toLocaleDateString('pt-BR', { day: '2-digit' }),
        packages: s.packages.length,
      }));

    // Gráfico de pizza - Distribuição por marketplace
    const marketplaceDistribution = sessions.reduce((acc, session) => {
      session.packages.forEach(pkg => {
        acc[pkg.type] = (acc[pkg.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Gráfico de barras - Performance por operador
    const operatorPerformance = sessions.reduce((acc, session) => {
      const operator = session.operatorName;
      if (!acc[operator]) {
        acc[operator] = { name: operator, packages: 0, sessions: 0, divergences: 0 };
      }
      acc[operator].packages += session.packages.length;
      acc[operator].sessions += 1;
      if (session.hasDivergence) acc[operator].divergences += 1;
      return acc;
    }, {} as Record<string, any>);

    return {
      lineChart: {
        labels: last7Days.map(d => d.day),
        datasets: [{
          data: last7Days.map(d => d.packages),
          color: (opacity = 1) => colors.primary,
          strokeWidth: 2,
        }],
      },
      pieChart: {
        labels: Object.keys(marketplaceDistribution),
        data: Object.values(marketplaceDistribution),
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      },
      barChart: {
        labels: Object.values(operatorPerformance).map((op: any) => op.name),
        datasets: [{
          data: Object.values(operatorPerformance).map((op: any) => op.packages),
        }],
      },
    };
  }, [sessions, colors]);

  // Renderiza abas
  const renderTabs = () => (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 4,
    }}>
      {[
        { key: 'overview', label: 'Visão Geral' },
        { key: 'insights', label: 'Insights IA' },
        { key: 'performance', label: 'Performance' },
        { key: 'quality', label: 'Qualidade' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setSelectedTab(tab.key as any)}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: selectedTab === tab.key ? colors.primary : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: selectedTab === tab.key ? '#fff' : colors.text,
            fontSize: 12,
            fontWeight: '600',
          }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Renderiza métricas principais
  const renderOverviewMetrics = () => (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 16,
      marginTop: 16,
    }}>
      {[
        { label: 'Sessões', value: metrics.totalSessions.toString(), color: colors.primary },
        { label: 'Pacotes', value: metrics.totalPackages.toString(), color: '#4ECDC4' },
        { label: 'Taxa Conclusão', value: `${metrics.completionRate.toFixed(1)}%`, color: '#45B7D1' },
        { label: 'Taxa Divergência', value: `${metrics.divergenceRate.toFixed(1)}%`, color: '#FF6B6B' },
      ].map((metric, index) => (
        <View key={`metric-${metric.label}-${index}`} style={{
          width: '50%',
          padding: 12,
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginBottom: 8,
          marginRight: index % 2 === 0 ? 8 : 0,
        }}>
          <Text style={{ color: colors.secondary, fontSize: 12, marginBottom: 4 }}>
            {metric.label}
          </Text>
          <Text style={{ 
            color: metric.color, 
            fontSize: 24, 
            fontWeight: 'bold' 
          }}>
            {metric.value}
          </Text>
        </View>
      ))}
    </View>
  );

  // Renderiza insights da IA
  const renderAIInsights = () => (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 12 
      }}>
        🤖 Insights Inteligentes
      </Text>
      
      {insights.length === 0 ? (
        <View style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 12,
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.secondary }}>
            Nenhum insight disponível no momento
          </Text>
        </View>
      ) : (
        insights.map((insight, index) => (
          <View key={`insight-${index}-${insight.type}`} style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: insight.severity === 'critical' ? '#FF6B6B' : 
                             insight.severity === 'high' ? '#FFA500' : 
                             insight.severity === 'medium' ? '#FFD700' : '#4ECDC4',
          }}>
            <Text style={{ 
              color: colors.text, 
              fontSize: 16, 
              fontWeight: '600', 
              marginBottom: 4 
            }}>
              {insight.title}
            </Text>
            <Text style={{ color: colors.secondary, fontSize: 14, marginBottom: 8 }}>
              {insight.description}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ 
                color: colors.secondary, 
                fontSize: 12 
              }}>
                Confiança: {(insight.confidence * 100).toFixed(0)}%
              </Text>
              {insight.actionable && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Ação Recomendada', insight.description)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    Agir
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Renderiza gráficos
  const renderCharts = () => (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 12 
      }}>
        📊 Análise Visual
      </Text>
      
      {/* Gráfico de Linhas */}
      <View style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Pacotes por Dia (Últimos 7 dias)
        </Text>
        <View style={{
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface2,
          borderRadius: 8,
        }}>
          <Text style={{ color: colors.secondary }}>Gráfico de linhas (requer react-native-chart-kit)</Text>
        </View>
      </View>

      {/* Gráfico de Pizza */}
      <View style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Distribuição por Marketplace
        </Text>
        <View style={{
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.surface2,
          borderRadius: 8,
        }}>
          <Text style={{ color: colors.secondary }}>Gráfico de pizza (requer react-native-chart-kit)</Text>
        </View>
      </View>
    </View>
  );

  // Renderiza estatísticas de qualidade
  const renderQualityStats = () => (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 12 
      }}>
        🔍 Estatísticas de Qualidade
      </Text>
      
      {/* Análise de Imagens */}
      <View style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Análise de Imagens
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.secondary }}>Analisados: {imageStats.totalAnalyzed}</Text>
          <Text style={{ color: '#FF6B6B' }}>Danos: {imageStats.damageDetected}</Text>
          <Text style={{ color: colors.primary }}>
            Confiança: {(imageStats.averageConfidence * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Status APIs */}
      <View style={{
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
          Status APIs Externas
        </Text>
        {Object.entries(apiStats.providersStatus).map(([provider, status]) => (
          <View key={provider} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <Text style={{ color: colors.secondary }}>{provider}</Text>
            <Text style={{ 
              color: status ? '#4ECDC4' : '#FF6B6B',
              fontWeight: '600'
            }}>
              {status ? 'Online' : 'Offline'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Renderiza conteúdo baseado na aba selecionada
  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <>
            {renderOverviewMetrics()}
            {renderCharts()}
          </>
        );
      case 'insights':
        return renderAIInsights();
      case 'performance':
        return renderCharts();
      case 'quality':
        return renderQualityStats();
      default:
        return renderOverviewMetrics();
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={{
        color: colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        margin: 16,
        marginBottom: 8,
      }}>
        🎯 Dashboard Inteligente
      </Text>

      {currentSession && (
        <View style={{
          backgroundColor: colors.primary + '20',
          marginHorizontal: 16,
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
            Sessão Ativa
          </Text>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {currentSession.operatorName} - {currentSession.packages.length}/{currentSession.declaredCount} pacotes
          </Text>
        </View>
      )}

      {renderTabs()}
      {renderContent()}
    </ScrollView>
  );
}
