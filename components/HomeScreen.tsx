import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import ModernButton from './ModernButton';
import ModernCard from './ModernCard';
import ModernIcon from './ModernIcon';

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
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;
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
      // Silently handle error
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const StatCard = ({ icon: Icon, title, value, subtitle, onPress, color = colors.primary }: any) => (
    <ModernCard
      title={value}
      subtitle={title}
      description={subtitle}
      icon={<Icon />}
      onPress={onPress}
      variant="elevated"
      size="md"
      fullWidth
      style={{ marginBottom: 12 }}
    />
  );

  const QuickAction = ({ icon: Icon, title, onPress, color = colors.primary }: any) => (
    <ModernButton
      title={title}
      onPress={onPress}
      variant="outline"
      size="md"
      icon={<Icon />}
      fullWidth
      style={{ marginBottom: 12 }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
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
          <View style={styles.actionItem}>
            <ModernButton
              title="Nova Sessão"
              onPress={onStartSession}
              variant="primary"
              size="md"
              icon={<Play />}
              fullWidth
            />
          </View>
          <View style={styles.actionItem}>
            <ModernButton
              title="Iniciar Scanner"
              onPress={onStartScanner}
              variant="secondary"
              size="md"
              icon={<Camera />}
              fullWidth
            />
          </View>
          <View style={styles.actionItem}>
            <ModernButton
              title="Histórico"
              onPress={onViewHistory}
              variant="outline"
              size="md"
              icon={<History />}
              fullWidth
            />
          </View>
        </View>
      </View>

      {sessions.length > 0 && (
        <View style={[styles.contentContainer, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
          <ModernCard
            title={`Última sessão: ${sessions[0].operatorName}`}
            description={`${sessions[0].packages.length} pacotes • ${new Date(sessions[0].startedAt).toLocaleDateString('pt-BR')}`}
            icon={<Users />}
            variant="glass"
            size="md"
            fullWidth
          />
        </View>
      )}

      <View style={styles.insightSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Insight do dia</Text>
        <ModernCard
          title="Operação em tempo real"
          description={
            todayStats.totalSessions === 0
              ? 'Comece uma nova conferência para gerar suas primeiras métricas do dia.'
              : todayStats.divergenceRate === 0
              ? 'Nenhuma divergência registrada hoje. Mantenha esse nível de precisão na conferência.'
              : todayStats.divergenceRate < 20
              ? 'Sua taxa de divergência está controlada. Continue acompanhando de perto os volumes mais altos.'
              : 'A taxa de divergência de hoje está acima do ideal. Priorize sessões com maiores volumes para investigação.'
          }
          variant="gradient"
          size="lg"
          fullWidth
        />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: 8,
  },
  header: {
    padding: 24,
    paddingTop: 16,
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
    paddingHorizontal: 24,
    gap: 12,
  },
  actionItem: {
    marginBottom: 8,
  },
  recentSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  insightSection: {
    marginBottom: 40,
  },
});
