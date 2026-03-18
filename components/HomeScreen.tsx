import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import MainLayout from '@/components/MainLayout';
import { Session } from '@/types/session';
import { loadSessions } from '@/utils/storage';
import { getSessionMetrics } from '@/utils/session';
import {
  Package,
  TrendingUp,
  Clock,
  Users,
  Play,
  History,
  Camera,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HomeScreenProps {
  onStartSession: () => void;
  onViewHistory: () => void;
  onStartScanner: () => void;
}

export default function HomeScreen({
  onStartSession,
  onViewHistory,
  onStartScanner,
}: HomeScreenProps) {
  const { colors } = useAppTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalSessions: 0,
    totalPackages: 0,
    totalValue: 0,
    avgPerSession: 0,
    divergenceRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      const totalValue = todaySessions.reduce((sum, session) => {
        const metrics = getSessionMetrics(session.packages);
        return sum + metrics.valueTotal;
      }, 0);

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
        totalValue,
        avgPerSession,
        divergenceRate,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, onPress, color = colors.primary }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textMuted }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: colors.textSubtle }]}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon: Icon, title, onPress, color = colors.primary }: any) => (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleQuickAction(onPress)}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Bem-vindo ao Beep Velozz
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sistema de scanner industrial
        </Text>
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Estatísticas de Hoje</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon={Package}
            title="Pacotes"
            value={todayStats.totalPackages.toString()}
            subtitle="Escaneados"
          />
          <StatCard
            icon={TrendingUp}
            title="Valor Total"
            value={`R$ ${todayStats.totalValue.toFixed(2)}`}
            subtitle="Processado"
          />
          <StatCard
            icon={Clock}
            title="Sessões"
            value={todayStats.totalSessions.toString()}
            subtitle="Concluídas"
          />
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
      </View>

      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
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
            icon={History}
            title="Histórico"
            onPress={onViewHistory}
            color={colors.primary}
          />
        </View>
      </View>

      {sessions.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
          <View style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recentHeader}>
              <Users size={20} color={colors.textMuted} />
              <Text style={[styles.recentTitle, { color: colors.text }]}>
                Última sessão: {sessions[0].operatorName}
              </Text>
            </View>
            <Text style={[styles.recentSubtitle, { color: colors.textMuted }]}>
              {sessions[0].packages.length} pacotes • {new Date(sessions[0].startedAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.insightSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Insight do dia</Text>
        <View style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.insightLabel, { color: colors.textMuted }]}>
            Operação em tempo real
          </Text>
          <Text style={[styles.insightText, { color: colors.text }]}>
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
      </ScrollView>
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
