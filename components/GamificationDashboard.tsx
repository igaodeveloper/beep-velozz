/**
 * Gamification Dashboard Component
 * Dashboard completo de gamificação com conquistas, ranking e desafios
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/utils/useAppTheme';
import { useGamification } from '@/hooks/useGamification';
import { Achievement, Challenge, LeaderboardEntry } from '@/types/gamification';

const { width: screenWidth } = Dimensions.get('window');

interface GamificationDashboardProps {
  userId: string;
  userName: string;
  onClose?: () => void;
}

export default function GamificationDashboard({
  userId,
  userName,
  onClose,
}: GamificationDashboardProps) {
  const { colors } = useAppTheme();
  const gamification = useGamification({ userId, userName });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'leaderboard' | 'challenges'>('profile');
  const slideAnim = useSharedValue(0);

  // Calcular progresso do nível
  const levelProgress = useMemo(() => gamification.getLevelProgress(), [gamification.profile]);

  // Obter conquistas por categoria
  const achievementsByCategory = useMemo(() => {
    const categories = {
      speed: gamification.getLockedAchievements().filter(a => a.category === 'speed'),
      accuracy: gamification.getLockedAchievements().filter(a => a.category === 'accuracy'),
      streak: gamification.getLockedAchievements().filter(a => a.category === 'streak'),
      volume: gamification.getLockedAchievements().filter(a => a.category === 'volume'),
      special: gamification.getLockedAchievements().filter(a => a.category === 'special'),
    };
    return categories;
  }, [gamification.achievements]);

  // Renderizar perfil do usuário
  const renderProfile = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {gamification.profile?.name || 'Carregando...'}
          </Text>
          <Text style={[styles.profileRank, { color: colors.primary }]}>
            {gamification.profile?.rank || 'Iniciante'}
          </Text>
        </View>
        
        <View style={styles.levelContainer}>
          <Text style={[styles.levelText, { color: colors.text }]}>
            Nível {gamification.profile?.level || 1}
          </Text>
          <Text style={[styles.experienceText, { color: colors.textSecondary }]}>
            {gamification.formatExperience(gamification.profile?.experience || 0)} XP
          </Text>
        </View>
      </View>

      {/* Barra de progresso do nível */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,
              width: `${levelProgress.progress}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        {levelProgress.current} / {levelProgress.next} XP
      </Text>

      {/* Estatísticas principais */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="trophy" size={24} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {gamification.formatPoints(gamification.profile?.totalPoints || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Pontos Totais
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="flame" size={24} color={colors.error} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {gamification.profile?.currentStreak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Sequência Atual
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="barcode" size={24} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {gamification.profile?.statistics.totalScans || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total de Scans
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {gamification.getLeaderboardPosition() || '-'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Posição no Ranking
          </Text>
        </View>
      </View>

      {/* Insights */}
      {gamification.getProfileInsights().length > 0 && (
        <View style={[styles.insightsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.insightsTitle, { color: colors.text }]}>
            💡 Seus Insights
          </Text>
          {gamification.getProfileInsights().map((insight, index) => (
            <Text key={index} style={[styles.insightText, { color: colors.textSecondary }]}>
              {insight}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Renderizar conquistas
  const renderAchievements = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🏆 Conquistas
      </Text>

      {/* Categorias de conquistas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryContainer}>
          {Object.entries(achievementsByCategory).map(([category, achievements]) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {category === 'speed' && '⚡ Velocidade'}
                {category === 'accuracy' && '🎯 Precisão'}
                {category === 'streak' && '🔥 Sequência'}
                {category === 'volume' && '📦 Volume'}
                {category === 'special' && '✨ Especial'}
              </Text>
              <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                {achievements.length} disponíveis
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Lista de conquistas */}
      <FlatList
        data={gamification.achievements}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.achievementsList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.achievementCard,
              {
                backgroundColor: colors.card,
                borderColor: item.unlockedAt ? colors.success : colors.border,
                borderWidth: item.unlockedAt ? 2 : 1,
              },
            ]}
          >
            <Text style={styles.achievementIcon}>{item.icon}</Text>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            
            {item.unlockedAt ? (
              <View style={styles.unlockedBadge}>
                <Text style={[styles.unlockedText, { color: 'white' }]}>
                  ✅ Desbloqueada
                </Text>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  Progresso: {item.progress}/{item.maxProgress}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: gamification.getRarityColor(item.rarity),
                        width: `${(item.progress / item.maxProgress) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );

  // Renderizar ranking
  const renderLeaderboard = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🏆 Ranking Global
      </Text>

      <FlatList
        data={gamification.leaderboard}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.leaderboardList}
        renderItem={({ item, index }) => {
          const isCurrentUser = item.userId === userId;
          const rankColor = index === 0 ? colors.warning : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : colors.text;
          
          return (
            <View
              style={[
                styles.leaderboardItem,
                {
                  backgroundColor: isCurrentUser ? colors.primary + '20' : colors.card,
                  borderColor: isCurrentUser ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rankNumber, { color: rankColor }]}>
                  #{item.rank}
                </Text>
                {item.change === 'up' && <Ionicons name="arrow-up" size={16} color={colors.success} />}
                {item.change === 'down' && <Ionicons name="arrow-down" size={16} color={colors.error} />}
              </View>

              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: colors.text }]}>
                  {item.userName} {isCurrentUser && '(Você)'}
                </Text>
                <Text style={[styles.playerStats, { color: colors.textSecondary }]}>
                  Nível {item.level} • {gamification.formatPoints(item.score)} pts
                </Text>
              </View>

              <View style={styles.playerMetrics}>
                <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                  📦 {item.statistics.totalScans}
                </Text>
                <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                  🎯 {item.statistics.accuracy}%
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  // Renderizar desafios
  const renderChallenges = () => (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        🎯 Desafios Ativos
      </Text>

      <View style={styles.challengesContainer}>
        {gamification.getActiveChallenges().map((challenge) => (
          <View
            key={challenge.id}
            style={[
              styles.challengeCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.challengeHeader}>
              <Text style={[styles.challengeType, { color: colors.primary }]}>
                {challenge.type === 'daily' && '📅 Diário'}
                {challenge.type === 'weekly' && '📆 Semanal'}
                {challenge.type === 'monthly' && '🗓️ Mensal'}
                {challenge.type === 'special' && '⭐ Especial'}
              </Text>
              <Text style={[styles.challengeReward, { color: colors.warning }]}>
                +{challenge.rewards.points} pts
              </Text>
            </View>

            <Text style={[styles.challengeTitle, { color: colors.text }]}>
              {challenge.title}
            </Text>
            <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
              {challenge.description}
            </Text>

            <View style={styles.challengeProgress}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {challenge.progress}/{challenge.requirements.target}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.success,
                      width: `${(challenge.progress / challenge.requirements.target) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {challenge.completed && !challenge.claimed && (
              <TouchableOpacity
                style={[styles.claimButton, { backgroundColor: colors.success }]}
                onPress={() => {
                  // Implementar lógica de reivindicar recompensa
                }}
              >
                <Text style={[styles.claimButtonText, { color: 'white' }]}>
                  Resgatar Recompensa
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  // Renderizar conteúdo baseado na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfile();
      case 'achievements':
        return renderAchievements();
      case 'leaderboard':
        return renderLeaderboard();
      case 'challenges':
        return renderChallenges();
      default:
        return renderProfile();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            🎮 Gamificação
          </Text>
          
          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsContainer}>
              {[
                { key: 'profile', label: 'Perfil', icon: 'person' },
                { key: 'achievements', label: 'Conquistas', icon: 'trophy' },
                { key: 'leaderboard', label: 'Ranking', icon: 'podium' },
                { key: 'challenges', label: 'Desafios', icon: 'flag' },
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
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={activeTab === tab.key ? 'white' : colors.text}
                  />
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
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileRank: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  levelContainer: {
    alignItems: 'flex-end',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  experienceText: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryCard: {
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 10,
  },
  achievementsList: {
    paddingBottom: 20,
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginRight: '2%',
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
  unlockedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
  },
  progressLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  leaderboardList: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerStats: {
    fontSize: 12,
    marginTop: 2,
  },
  playerMetrics: {
    alignItems: 'flex-end',
  },
  metricText: {
    fontSize: 10,
    marginBottom: 2,
  },
  challengesContainer: {
    paddingBottom: 20,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeType: {
    fontSize: 12,
    fontWeight: '500',
  },
  challengeReward: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  challengeProgress: {
    marginTop: 8,
  },
  claimButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
