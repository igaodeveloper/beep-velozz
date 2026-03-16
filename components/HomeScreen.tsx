import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import MainLayout from '@/components/MainLayout';
import SimpleScrollView from '@/components/SimpleScrollView';
import { Session } from '@/types/session';
import { loadSessions } from '@/utils/storage';
import { getSessionMetrics } from '@/utils/session';
import {
  Package,
  TrendingUp,
  Clock,
  Users,
  Play,
  BarChart3,
  History,
  Camera,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useResponsive, useResponsiveTypography, useResponsiveSpacing, useResponsiveGrid } from '@/hooks/useResponsiveAdvanced';

interface HomeScreenProps {
  onStartSession: () => void;
  onViewHistory: () => void;
  onViewAnalytics: () => void;
  onStartScanner: () => void;
}

export default function HomeScreen({
  onStartSession,
  onViewHistory,
  onViewAnalytics,
  onStartScanner,
}: HomeScreenProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  const typography = useResponsiveTypography();
  const spacing = useResponsiveSpacing();
  const grid = useResponsiveGrid();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalSessions: 0,
    totalPackages: 0,
    avgPerSession: 0,
    divergenceRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions);
      
      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = loadedSessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      });

      const totalPackages = todaySessions.reduce(
        (sum, session) => sum + session.packages.length,
        0
      );

      const avgPerSession =
        todaySessions.length > 0
          ? Math.round(totalPackages / todaySessions.length)
          : 0;

      const divergencesToday = todaySessions.filter(
        (session) => session.hasDivergence
      ).length;
      const divergenceRate =
        todaySessions.length > 0
          ? Math.round((divergencesToday / todaySessions.length) * 100)
          : 0;

      setTodayStats({
        totalSessions: todaySessions.length,
        totalPackages,
        avgPerSession,
        divergenceRate,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleQuickAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  // Responsive styles
  const responsiveStyles = useMemo(() => ({
    statCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: responsive.isMobile ? spacing.md : spacing.lg,
      borderRadius: responsive.isMobile ? 12 : 14,
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    statIcon: {
      width: responsive.isMobile ? 48 : 56,
      height: responsive.isMobile ? 48 : 56,
      borderRadius: responsive.isMobile ? 12 : 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.md,
    },
    quickAction: {
      width: responsive.isMobile ? '48%' as const : responsive.isTablet ? '31%' as const : '23%' as const,
      alignItems: 'center' as const,
      padding: responsive.isMobile ? spacing.md : spacing.lg,
      borderRadius: responsive.isMobile ? 12 : 14,
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    actionIcon: {
      width: responsive.isMobile ? 40 : 48,
      height: responsive.isMobile ? 40 : 48,
      borderRadius: responsive.isMobile ? 10 : 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing.sm,
    },
  }), [responsive, spacing, colors]);

  // Memoized components
  const StatCard = useMemo(() => ({ icon: Icon, title, value, subtitle, onPress, color = colors.primary }: any) => (
    <TouchableOpacity
      style={responsiveStyles.statCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[responsiveStyles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={responsive.isMobile ? 24 : 28} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: typography.h3, fontWeight: '700', marginBottom: 4 }}>
          {value}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.body, fontWeight: '500', marginBottom: 2 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: colors.textSubtle, fontSize: typography.caption }}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ), [responsiveStyles, colors, typography, responsive]);

  const QuickAction = useMemo(() => ({ icon: Icon, title, onPress, color = colors.primary }: any) => (
    <TouchableOpacity
      style={responsiveStyles.quickAction}
      onPress={() => handleQuickAction(onPress)}
      activeOpacity={0.8}
    >
      <View style={[responsiveStyles.actionIcon, { backgroundColor: color + '20' }]}>
        <Icon size={responsive.isMobile ? 20 : 24} color={color} />
      </View>
      <Text style={{ color: colors.text, fontSize: typography.caption, fontWeight: '600', textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  ), [responsiveStyles, colors, typography, responsive]);
  return (
    <MainLayout>
      <SimpleScrollView
        enableRefreshControl
        onRefresh={onRefresh}
        refreshing={refreshing}
        responsivePadding
      >

        {/* Header */}
        <View style={{ padding: spacing.xl, paddingTop: responsive.isMobile ? spacing.xxxl : spacing.xxl }}>
          <Text style={{ color: colors.text, fontSize: typography.h1, fontWeight: '700', marginBottom: spacing.sm }}>
            Bem-vindo ao Beep Velozz
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.body, lineHeight: 22 }}>
            Sistema de scanner industrial
          </Text>
        </View>
        {/* Stats Section */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ color: colors.text, fontSize: typography.h2, fontWeight: '600', marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
            Estatísticas de Hoje
          </Text>
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <StatCard
            icon={Package}
            title="Pacotes"
            value={todayStats.totalPackages.toString()}
            subtitle="Escaneados"
          />
          <StatCard
            icon={Clock}
            title="Sessões"
            value={todayStats.totalSessions.toString()}
            subtitle="Concluídas"
          />
          {responsive.isDesktop && (
            <>
              <StatCard
                icon={TrendingUp}
                title="Média por sessão"
                value={todayStats.avgPerSession.toString()}
                subtitle="Pacotes por sessão"
              />
              <StatCard
                icon={Clock}
                title="Risco de divergência"
                value={`${todayStats.divergenceRate}%`}
                subtitle={
                  todayStats.divergenceRate === 0
                    ? 'Operação estável'
                    : todayStats.divergenceRate < 20
                    ? 'Risco baixo'
                    : todayStats.divergenceRate < 40
                    ? 'Risco moderado'
                    : 'Risco elevado'
                }
              />
            </>
          )}
        </View>
        
        {/* Mobile stats grid */}
        {responsive.isMobile && (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
            <StatCard
              icon={TrendingUp}
              title="Média por sessão"
              value={todayStats.avgPerSession.toString()}
              subtitle="Pacotes por sessão"
            />
            <StatCard
              icon={Clock}
              title="Risco de divergência"
              value={`${todayStats.divergenceRate}%`}
              subtitle={
                todayStats.divergenceRate === 0
                  ? 'Operação estável'
                  : todayStats.divergenceRate < 20
                  ? 'Risco baixo'
                  : todayStats.divergenceRate < 40
                  ? 'Risco moderado'
                  : 'Risco elevado'
              }
            />
          </View>
        )}
        </View>

        {/* Actions Section */}
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{ color: colors.text, fontSize: typography.h2, fontWeight: '600', marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
            Ações Rápidas
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            paddingHorizontal: spacing.lg, 
            gap: spacing.sm 
          }}>
          <QuickAction
            icon={Play}
            title="Nova Sessão"
            onPress={onStartSession}
            color={colors.success}
          />
          <QuickAction
            icon={Camera}
            title="Iniciar Scanner"
            onPress={onStartScanner}
            color={colors.primary}
          />
          <QuickAction
            icon={BarChart3}
            title="Analytics"
            onPress={onViewAnalytics}
            color={colors.warning}
          />
          <QuickAction
            icon={History}
            title="Histórico"
            onPress={onViewHistory}
            color={colors.primary}
          />
        </View>
      </View>

        {/* Recent Activity */}
        {sessions.length > 0 && (
          <View style={{ marginBottom: spacing.xxl, paddingHorizontal: spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: typography.h2, fontWeight: '600', marginBottom: spacing.md }}>
              Atividade Recente
            </Text>
            <View style={{ 
              padding: spacing.lg, 
              borderRadius: responsive.isMobile ? 12 : 14,
              borderWidth: 1,
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Users size={responsive.isMobile ? 20 : 24} color={colors.textMuted} />
                <Text style={{ 
                  color: colors.text, 
                  fontSize: typography.body, 
                  fontWeight: '600', 
                  marginLeft: spacing.sm,
                  flex: 1 
                }}>
                  Última sessão: {sessions[0].operatorName}
                </Text>
              </View>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: typography.caption,
                marginLeft: responsive.isMobile ? 32 : 36 
              }}>
                {sessions[0].packages.length} pacotes • {new Date(sessions[0].startedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        )}

        {/* Daily Insight */}
        <View style={{ marginBottom: spacing.xxxl, paddingHorizontal: spacing.lg }}>
          <Text style={{ color: colors.text, fontSize: typography.h2, fontWeight: '600', marginBottom: spacing.md }}>
            Insight do dia
          </Text>
          <View style={{ 
            marginTop: spacing.sm,
            borderRadius: responsive.isMobile ? 14 : 16,
            borderWidth: 1,
            padding: spacing.lg,
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }}>
            <Text style={{ 
              color: colors.textMuted, 
              fontSize: typography.small, 
              fontWeight: '700', 
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: spacing.sm 
            }}>
              Operação em tempo real
            </Text>
            <Text style={{ 
              color: colors.text, 
              fontSize: typography.body, 
              lineHeight: 20,
              fontWeight: '500' 
            }}>
              {todayStats.totalSessions === 0
                ? 'Comece uma nova conferência para gerar suas primeiras métricas do dia.'
                : todayStats.divergenceRate === 0
                ? 'Nenhuma divergência registrada hoje. Mantenha esse nível de precisão na conferência.'
                : todayStats.divergenceRate < 20
                ? 'Sua taxa de divergência está controlada. Continue acompanhando de perto os volumes mais altos.'
                : 'A taxa de divergência de hoje está acima do ideal. Priorize sessões com maiores volumes para investigação.'}
            </Text>
          </View>
        </View>
      </SimpleScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  recentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  recentSubtitle: {
    fontSize: 14,
    marginLeft: 32,
  },
  insightSection: {
    marginBottom: 40,
  },
  insightCard: {
    marginTop: 12,
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
