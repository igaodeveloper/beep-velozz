/**
 * Financial Dashboard Component
 * Dashboard completo de métricas financeiras e ROI
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useFinancial } from '@/hooks/useFinancial';
import { FinancialKPI } from '@/types/financial';

const { width: screenWidth } = Dimensions.get('window');

interface FinancialDashboardProps {
  operatorId: string;
  onClose?: () => void;
}

export default function FinancialDashboard({
  operatorId,
  onClose,
}: FinancialDashboardProps) {
  const { colors } = useAppTheme();
  const financial = useFinancial({ operatorId });
  
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'roi' | 'projections'>('overview');

  // Dados do gráfico (simulados)
  const chartData = useMemo(() => {
    return {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        data: [120, 145, 180, 160, 190, 220, 180],
        color: colors.primary,
        strokeWidth: 2,
      }],
    };
  }, [colors.primary]);

  // Renderizar visão geral
  const renderOverview = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        💰 Visão Geral Financeira
      </Text>

      {/* KPIs principais */}
      <View style={styles.kpiGrid}>
        {financial.kpis.map((kpi, index) => (
          <View
            key={index}
            style={[
              styles.kpiCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiName, { color: colors.textSecondary }]}>
                {kpi.name}
              </Text>
              <View style={styles.kpiTrend}>
                {kpi.trend === 'up' && (
                  <Text style={[styles.trendText, { color: colors.success }]}>
                    ↑ {kpi.changePercent}%
                  </Text>
                )}
                {kpi.trend === 'down' && (
                  <Text style={[styles.trendText, { color: colors.error }]}>
                    ↓ {kpi.changePercent}%
                  </Text>
                )}
                {kpi.trend === 'stable' && (
                  <Text style={[styles.trendText, { color: colors.textSecondary }]}>
                    → {kpi.changePercent}%
                  </Text>
                )}
              </View>
            </View>
            
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              {kpi.unit === 'R$' ? financial.formatCurrency(kpi.value) : `${kpi.value}${kpi.unit}`}
            </Text>
            <Text style={[styles.kpiTarget, { color: colors.textSecondary }]}>
              Meta: {kpi.unit === 'R$' ? financial.formatCurrency(kpi.target) : `${kpi.target}${kpi.unit}`}
            </Text>
          </View>
        ))}
      </View>

      {/* Gráfico de receita */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          📈 Receita da Semana
        </Text>
        <View style={styles.chartPlaceholder}>
          <Text style={[styles.chartPlaceholderText, { color: colors.textSecondary }]}>
            📊 Gráfico de receita seria exibido aqui
          </Text>
          <Text style={[styles.chartPlaceholderSubtext, { color: colors.textSecondary }]}>
            Seg: R$120 | Ter: R$145 | Qua: R$180 | Qui: R$160 | Sex: R$190 | Sáb: R$220 | Dom: R$180
          </Text>
        </View>
      </View>

      {/* Insights financeiros */}
      {financial.getFinancialInsights().length > 0 && (
        <View style={[styles.insightsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.insightsTitle, { color: colors.text }]}>
            💡 Insights Financeiros
          </Text>
          {financial.getFinancialInsights().map((insight, index) => (
            <Text key={index} style={[styles.insightText, { color: colors.textSecondary }]}>
              {insight}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Renderizar sessões
  const renderSessions = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        📊 Sessões Recentes
      </Text>

      <View style={styles.periodSelector}>
        {['daily', 'weekly', 'monthly'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period ? colors.primary : colors.card,
                borderColor: selectedPeriod === period ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: selectedPeriod === period ? 'white' : colors.text },
              ]}
            >
              {period === 'daily' && 'Diário'}
              {period === 'weekly' && 'Semanal'}
              {period === 'monthly' && 'Mensal'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de sessões simuladas */}
      <View style={styles.sessionsList}>
        {[1, 2, 3, 4, 5].map((session) => (
          <View
            key={session}
            style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sessionHeader}>
              <Text style={[styles.sessionDate, { color: colors.text }]}>
                Sessão #{session}
              </Text>
              <Text style={[styles.sessionValue, { color: colors.success }]}>
                {financial.formatCurrency(150 + session * 25)}
              </Text>
            </View>
            
            <View style={styles.sessionMetrics}>
              <Text style={[styles.sessionMetric, { color: colors.textSecondary }]}>
                📦 {45 + session * 5} pacotes
              </Text>
              <Text style={[styles.sessionMetric, { color: colors.textSecondary }]}>
                ⏱️ {2.5 - session * 0.1}s por pacote
              </Text>
              <Text style={[styles.sessionMetric, { color: colors.textSecondary }]}>
                🎯 {95 + session}% acurácia
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Renderizar ROI
  const renderROI = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        📈 Análise de ROI
      </Text>

      <View style={styles.roiGrid}>
        <View style={[styles.roiCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.roiTitle, { color: colors.text }]}>
            💰 Investimento Total
          </Text>
          <Text style={[styles.roiValue, { color: colors.text }]}>
            {financial.formatCurrency(2500)}
          </Text>
          <Text style={[styles.roiDescription, { color: colors.textSecondary }]}>
            Treinamento + Equipamentos
          </Text>
        </View>

        <View style={[styles.roiCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.roiTitle, { color: colors.text }]}>
            📊 Retorno Total
          </Text>
          <Text style={[styles.roiValue, { color: colors.success }]}>
            {financial.formatCurrency(6250)}
          </Text>
          <Text style={[styles.roiDescription, { color: colors.textSecondary }]}>
            Ganhos acumulados
          </Text>
        </View>

        <View style={[styles.roiCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.roiTitle, { color: colors.text }]}>
            ⏱️ Payback Period
          </Text>
          <Text style={[styles.roiValue, { color: colors.primary }]}>
            45 dias
          </Text>
          <Text style={[styles.roiDescription, { color: colors.textSecondary }]}>
            Tempo para retorno
          </Text>
        </View>

        <View style={[styles.roiCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.roiTitle, { color: colors.text }]}>
            📈 ROI Percentage
          </Text>
          <Text style={[styles.roiValue, { color: colors.success }]}>
            150%
          </Text>
          <Text style={[styles.roiDescription, { color: colors.textSecondary }]}>
            Retorno sobre investimento
          </Text>
        </View>
      </View>

      {/* Gráfico de ROI */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          📊 Projeção de ROI (6 meses)
        </Text>
        <View style={styles.chartPlaceholder}>
          <Text style={[styles.chartPlaceholderText, { color: colors.textSecondary }]}>
            📊 Gráfico de ROI seria exibido aqui
          </Text>
          <Text style={[styles.chartPlaceholderSubtext, { color: colors.textSecondary }]}>
            Mês 1: 20% | Mês 2: 45% | Mês 3: 70% | Mês 4: 95% | Mês 5: 120% | Mês 6: 150%
          </Text>
        </View>
      </View>
    </View>
  );

  // Renderizar projeções
  const renderProjections = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🔮 Projeções de Receita
      </Text>

      <View style={styles.projectionsContainer}>
        <View style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.projectionHeader}>
            <Text style={[styles.projectionTitle, { color: colors.text }]}>
              📊 Cenário Conservador
            </Text>
            <Text style={[styles.projectionGrowth, { color: colors.textSecondary }]}>
              +10% crescimento
            </Text>
          </View>
          
          <View style={styles.projectionMetrics}>
            <Text style={[styles.projectionMetric, { color: colors.text }]}>
              Pacotes: 2,750/mês
            </Text>
            <Text style={[styles.projectionRevenue, { color: colors.text }]}>
              {financial.formatCurrency(16500)}
            </Text>
          </View>
        </View>

        <View style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={styles.projectionHeader}>
            <Text style={[styles.projectionTitle, { color: colors.text }]}>
              📈 Cenário Realista
            </Text>
            <Text style={[styles.projectionGrowth, { color: colors.primary }]}>
              +25% crescimento
            </Text>
          </View>
          
          <View style={styles.projectionMetrics}>
            <Text style={[styles.projectionMetric, { color: colors.text }]}>
              Pacotes: 3,125/mês
            </Text>
            <Text style={[styles.projectionRevenue, { color: colors.success }]}>
              {financial.formatCurrency(18750)}
            </Text>
          </View>
        </View>

        <View style={[styles.projectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.projectionHeader}>
            <Text style={[styles.projectionTitle, { color: colors.text }]}>
              🚀 Cenário Otimista
            </Text>
            <Text style={[styles.projectionGrowth, { color: colors.success }]}>
              +50% crescimento
            </Text>
          </View>
          
          <View style={styles.projectionMetrics}>
            <Text style={[styles.projectionMetric, { color: colors.text }]}>
              Pacotes: 3,750/mês
            </Text>
            <Text style={[styles.projectionRevenue, { color: colors.success }]}>
              {financial.formatCurrency(22500)}
            </Text>
          </View>
        </View>
      </View>

      {/* Recomendações */}
      {financial.getFinancialRecommendations().length > 0 && (
        <View style={[styles.recommendationsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
            📋 Recomendações
          </Text>
          {financial.getFinancialRecommendations().map((recommendation, index) => (
            <Text key={index} style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {recommendation}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'sessions':
        return renderSessions();
      case 'roi':
        return renderROI();
      case 'projections':
        return renderProjections();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          💰 Financeiro
        </Text>
        
        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsContainer}>
            {[
              { key: 'overview', label: 'Visão Geral', icon: 'analytics' },
              { key: 'sessions', label: 'Sessões', icon: 'list' },
              { key: 'roi', label: 'ROI', icon: 'trending-up' },
              { key: 'projections', label: 'Projeções', icon: 'stats-chart' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: activeTab === tab.key ? colors.primary : 'transparent',
                    borderColor: activeTab === tab.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? 'white' : colors.text },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiName: {
    fontSize: 12,
    fontWeight: '500',
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiTarget: {
    fontSize: 10,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  chartPlaceholderSubtext: {
    fontSize: 10,
    textAlign: 'center',
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    marginBottom: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionsList: {
    paddingBottom: 20,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionMetric: {
    fontSize: 10,
  },
  roiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roiCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  roiTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  roiValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roiDescription: {
    fontSize: 10,
  },
  projectionsContainer: {
    paddingBottom: 20,
  },
  projectionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  projectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectionGrowth: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectionMetrics: {
    alignItems: 'center',
  },
  projectionMetric: {
    fontSize: 12,
    marginBottom: 8,
  },
  projectionRevenue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
