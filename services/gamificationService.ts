/**
 * Gamification Service
 * Sistema completo de gamificação para engajamento e retenção
 */

import {
  Achievement,
  UserProfile,
  LeaderboardEntry,
  Challenge,
  GameEvent,
  GamificationConfig,
  StreakData,
  Reward,
} from "@/types/gamification";
import { PackageType } from "@/types/scanner";
import { ScannedPackage } from "@/types/session";

export class GamificationService {
  private config: GamificationConfig = {
    enableAchievements: true,
    enableLeaderboard: true,
    enableChallenges: true,
    enableStreaks: true,
    enableNotifications: true,
    pointsPerScan: 10,
    experiencePerScan: 5,
    streakBonusMultiplier: 1.5,
    levelThresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000],
    rankNames: [
      "Iniciante",
      "Aprendiz",
      "Operador",
      "Especialista",
      "Mestre",
      "Veterano",
      "Elite",
      "Lendário",
      "Mítico",
      "Supremo",
    ],
  };

  private userProfiles: Map<string, UserProfile> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private leaderboard: LeaderboardEntry[] = [];
  private events: GameEvent[] = [];

  constructor() {
    this.initializeAchievements();
    this.initializeChallenges();
  }

  /**
   * Inicializa conquistas disponíveis
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Conquistas de Velocidade
      {
        id: "speed_demon",
        title: "Demônio da Velocidade",
        description: "Escaneie 50 pacotes em menos de 5 minutos",
        icon: "⚡",
        category: "speed",
        rarity: "rare",
        points: 500,
        progress: 0,
        maxProgress: 50,
        requirements: [
          { type: "scans_in_time", value: 50, condition: "5_minutes" },
        ],
      },
      {
        id: "lightning_fast",
        title: "Rápido como um Relâmpago",
        description: "Mantenha média de menos de 2 segundos por scan",
        icon: "🚀",
        category: "speed",
        rarity: "epic",
        points: 750,
        progress: 0,
        maxProgress: 100,
        requirements: [
          { type: "average_speed", value: 2, condition: "seconds_per_scan" },
        ],
      },
      // Conquistas de Acurácia
      {
        id: "perfectionist",
        title: "Perfeccionista",
        description: "Alcance 100% de acurácia em uma sessão",
        icon: "🎯",
        category: "accuracy",
        rarity: "epic",
        points: 600,
        progress: 0,
        maxProgress: 1,
        requirements: [{ type: "perfect_session", value: 1 }],
      },
      {
        id: "accuracy_master",
        title: "Mestre da Precisão",
        description: "Mantenha 95% de acurácia por 7 dias seguidos",
        icon: "🏹",
        category: "accuracy",
        rarity: "legendary",
        points: 1000,
        progress: 0,
        maxProgress: 7,
        requirements: [
          { type: "daily_accuracy", value: 95, condition: "7_days" },
        ],
      },
      // Conquistas de Sequência
      {
        id: "on_fire",
        title: "Em Chamas",
        description: "Mantenha uma sequência de 5 dias ativos",
        icon: "🔥",
        category: "streak",
        rarity: "common",
        points: 200,
        progress: 0,
        maxProgress: 5,
        requirements: [{ type: "daily_streak", value: 5 }],
      },
      {
        id: "unstoppable",
        title: "Inparável",
        description: "Alcance uma sequência de 30 dias",
        icon: "💎",
        category: "streak",
        rarity: "legendary",
        points: 1500,
        progress: 0,
        maxProgress: 30,
        requirements: [{ type: "daily_streak", value: 30 }],
      },
      // Conquistas de Volume
      {
        id: "busy_bee",
        title: "Abelha Operosa",
        description: "Escaneie 100 pacotes em um único dia",
        icon: "🐝",
        category: "volume",
        rarity: "common",
        points: 300,
        progress: 0,
        maxProgress: 100,
        requirements: [{ type: "daily_scans", value: 100 }],
      },
      {
        id: "pac_machine",
        title: "Máquina de Pacotes",
        description: "Escaneie 10.000 pacotes no total",
        icon: "📦",
        category: "volume",
        rarity: "epic",
        points: 800,
        progress: 0,
        maxProgress: 10000,
        requirements: [{ type: "total_scans", value: 10000 }],
      },
    ];

    achievements.forEach((achievement) => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Inicializa desafios disponíveis
   */
  private initializeChallenges(): void {
    const now = Date.now();

    // Desafio Diário
    const dailyChallenge: Challenge = {
      id: "daily_scanner",
      title: "Scanner Diário",
      description: "Escaneie 50 pacotes hoje",
      type: "daily",
      category: "scans",
      requirements: {
        type: "daily_scans",
        target: 50,
        timeframe: 86400000, // 24 horas
      },
      rewards: {
        points: 100,
        experience: 50,
      },
      startDate: now,
      endDate: now + 86400000,
      progress: 0,
      completed: false,
      claimed: false,
    };

    // Desafio Semanal
    const weeklyChallenge: Challenge = {
      id: "weekly_accuracy",
      title: "Precisão Semanal",
      description: "Mantenha 90% de acurácia esta semana",
      type: "weekly",
      category: "accuracy",
      requirements: {
        type: "weekly_accuracy",
        target: 90,
        timeframe: 604800000, // 7 dias
      },
      rewards: {
        points: 500,
        experience: 250,
      },
      startDate: now,
      endDate: now + 604800000,
      progress: 0,
      completed: false,
      claimed: false,
    };

    this.challenges.set("daily_scanner", dailyChallenge);
    this.challenges.set("weekly_accuracy", weeklyChallenge);
  }

  /**
   * Obtém ou cria perfil do usuário
   */
  getUserProfile(userId: string, userName: string): UserProfile {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        id: userId,
        name: userName,
        level: 1,
        experience: 0,
        totalPoints: 0,
        currentStreak: 0,
        bestStreak: 0,
        rank: "Iniciante",
        badges: [],
        statistics: {
          totalScans: 0,
          totalSessions: 0,
          averageAccuracy: 0,
          averageSpeed: 0,
          totalTime: 0,
          favoriteType: "avulso",
        },
        preferences: {
          notificationsEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          theme: "light",
        },
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Processa evento de scan e atualiza gamificação
   */
  processScan(
    userId: string,
    userName: string,
    packageData: ScannedPackage,
    accuracy: number,
    speed: number,
  ): {
    points: number;
    experience: number;
    levelUp: boolean;
    newLevel?: number;
    achievementsUnlocked: Achievement[];
    challengesUpdated: Challenge[];
  } {
    const profile = this.getUserProfile(userId, userName);
    const now = Date.now();

    let pointsEarned = this.config.pointsPerScan;
    let experienceEarned = this.config.experiencePerScan;
    const achievementsUnlocked: Achievement[] = [];
    const challengesUpdated: Challenge[] = [];

    // Bônus por sequência
    if (this.config.enableStreaks && this.isStreakActive(userId)) {
      pointsEarned = Math.round(
        pointsEarned * this.config.streakBonusMultiplier,
      );
      experienceEarned = Math.round(
        experienceEarned * this.config.streakBonusMultiplier,
      );
    }

    // Atualizar estatísticas
    profile.statistics.totalScans++;
    profile.statistics.averageAccuracy =
      (profile.statistics.averageAccuracy *
        (profile.statistics.totalScans - 1) +
        accuracy) /
      profile.statistics.totalScans;
    profile.statistics.averageSpeed =
      (profile.statistics.averageSpeed * (profile.statistics.totalScans - 1) +
        speed) /
      profile.statistics.totalScans;
    profile.statistics.totalTime += speed;

    // Atualizar tipo favorito
    this.updateFavoriteType(profile, packageData.type);

    // Adicionar pontos e experiência
    profile.totalPoints += pointsEarned;
    profile.experience += experienceEarned;
    profile.lastActiveAt = now;

    // Verificar level up
    const oldLevel = profile.level;
    const newLevel = this.calculateLevel(profile.experience);
    const levelUp = newLevel > oldLevel;

    if (levelUp) {
      profile.level = newLevel;
      profile.rank = this.config.rankNames[newLevel - 1] || "Supremo";

      // Registrar evento de level up
      this.registerEvent({
        id: `level_up_${now}`,
        type: "level_up",
        timestamp: now,
        userId,
        data: {
          level: newLevel,
          experience: profile.experience,
        },
      });
    }

    // Verificar conquistas
    const newAchievements = this.checkAchievements(userId, profile);
    achievementsUnlocked.push(...newAchievements);

    // Atualizar desafios
    const updatedChallenges = this.updateChallenges(userId, profile);
    challengesUpdated.push(...updatedChallenges);

    // Atualizar leaderboard
    this.updateLeaderboard(userId, profile);

    // Registrar evento de scan
    this.registerEvent({
      id: `scan_${now}`,
      type: "scan",
      timestamp: now,
      userId,
      data: {
        points: pointsEarned,
        experience: experienceEarned,
        packageType: packageData.type,
        accuracy,
        speed,
      },
    });

    return {
      points: pointsEarned,
      experience: experienceEarned,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      achievementsUnlocked,
      challengesUpdated,
    };
  }

  /**
   * Calcula nível baseado na experiência
   */
  private calculateLevel(experience: number): number {
    for (let i = this.config.levelThresholds.length - 1; i >= 0; i--) {
      if (experience >= this.config.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Verifica conquistas desbloqueadas
   */
  private checkAchievements(
    userId: string,
    profile: UserProfile,
  ): Achievement[] {
    const unlockedAchievements: Achievement[] = [];

    for (const [achievementId, achievement] of this.achievements.entries()) {
      // Pular se já desbloqueada
      if (profile.badges.some((badge) => badge.id === achievementId)) {
        continue;
      }

      let shouldUnlock = false;
      let progress = 0;

      // Verificar requisitos
      for (const requirement of achievement.requirements) {
        switch (requirement.type) {
          case "total_scans":
            progress = profile.statistics.totalScans;
            shouldUnlock = progress >= requirement.value;
            break;
          case "daily_scans":
            progress = this.getTodayScans(userId);
            shouldUnlock = progress >= requirement.value;
            break;
          case "perfect_session":
            shouldUnlock = profile.statistics.averageAccuracy >= 99;
            progress = profile.statistics.averageAccuracy >= 99 ? 1 : 0;
            break;
          case "daily_streak":
            progress = profile.currentStreak;
            shouldUnlock = progress >= requirement.value;
            break;
          case "average_speed":
            progress =
              profile.statistics.averageSpeed <= requirement.value ? 1 : 0;
            shouldUnlock = profile.statistics.averageSpeed <= requirement.value;
            break;
          case "daily_accuracy":
            progress = this.getDailyAccuracy(userId);
            shouldUnlock = progress >= requirement.value;
            break;
        }
      }

      // Atualizar progresso da conquista
      achievement.progress = Math.min(progress, achievement.maxProgress);

      if (shouldUnlock) {
        achievement.unlockedAt = Date.now();
        profile.badges.push(achievement);
        profile.totalPoints += achievement.points;
        unlockedAchievements.push(achievement);

        // Registrar evento
        this.registerEvent({
          id: `achievement_${achievementId}_${Date.now()}`,
          type: "achievement_unlock",
          timestamp: Date.now(),
          userId,
          data: {
            achievement,
            points: achievement.points,
          },
        });
      }
    }

    return unlockedAchievements;
  }

  /**
   * Atualiza desafios ativos
   */
  private updateChallenges(userId: string, profile: UserProfile): Challenge[] {
    const updatedChallenges: Challenge[] = [];

    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.completed || challenge.claimed) {
        continue;
      }

      let progress = 0;

      switch (challenge.requirements.type) {
        case "daily_scans":
          progress = this.getTodayScans(userId);
          break;
        case "weekly_accuracy":
          progress = this.getWeeklyAccuracy(userId);
          break;
      }

      challenge.progress = Math.min(progress, challenge.requirements.target);

      if (progress >= challenge.requirements.target && !challenge.completed) {
        challenge.completed = true;
        updatedChallenges.push(challenge);

        // Adicionar recompensas
        profile.totalPoints += challenge.rewards.points;
        profile.experience += challenge.rewards.experience;

        if (challenge.rewards.badge) {
          profile.badges.push(challenge.rewards.badge);
        }
      }
    }

    return updatedChallenges;
  }

  /**
   * Atualiza leaderboard
   */
  private updateLeaderboard(userId: string, profile: UserProfile): void {
    const existingEntry = this.leaderboard.find(
      (entry) => entry.userId === userId,
    );

    const entry: LeaderboardEntry = {
      userId,
      userName: profile.name,
      score: profile.totalPoints,
      level: profile.level,
      rank: 0,
      change: "same",
      statistics: {
        totalScans: profile.statistics.totalScans,
        accuracy: profile.statistics.averageAccuracy,
        speed: profile.statistics.averageSpeed,
      },
    };

    if (existingEntry) {
      const oldScore = existingEntry.score;
      entry.change =
        entry.score > oldScore
          ? "up"
          : entry.score < oldScore
            ? "down"
            : "same";

      // Remover entrada antiga
      const index = this.leaderboard.indexOf(existingEntry);
      this.leaderboard.splice(index, 1);
    }

    this.leaderboard.push(entry);

    // Ordenar e atualizar ranks
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Manter apenas top 100
    this.leaderboard = this.leaderboard.slice(0, 100);
  }

  /**
   * Atualiza tipo favorito de pacote
   */
  private updateFavoriteType(profile: UserProfile, type: PackageType): void {
    // Implementação simplificada - poderia usar contagem real
    profile.statistics.favoriteType = type;
  }

  /**
   * Verifica se sequência está ativa
   */
  private isStreakActive(userId: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile) return false;

    const now = Date.now();
    const lastActive = new Date(profile.lastActiveAt);
    const today = new Date(now);

    // Verificar se o último acesso foi hoje ou ontem
    const daysDiff = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysDiff <= 1;
  }

  /**
   * Obtém scans de hoje
   */
  private getTodayScans(userId: string): number {
    // Implementação simplificada - deveria usar dados reais
    return Math.floor(Math.random() * 100);
  }

  /**
   * Obtém acurácia diária
   */
  private getDailyAccuracy(userId: string): number {
    // Implementação simplificada
    return 85 + Math.random() * 15;
  }

  /**
   * Obtém acurácia semanal
   */
  private getWeeklyAccuracy(userId: string): number {
    // Implementação simplificada
    return 80 + Math.random() * 20;
  }

  /**
   * Registra evento de gamificação
   */
  private registerEvent(event: GameEvent): void {
    this.events.push(event);

    // Manter apenas últimos 1000 eventos
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Obtém perfil do usuário
   */
  getProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Obtém leaderboard
   */
  getLeaderboard(limit: number = 50): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  /**
   * Obtém conquistas disponíveis
   */
  getAchievements(userId?: string): Achievement[] {
    if (!userId) {
      return Array.from(this.achievements.values());
    }

    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return Array.from(this.achievements.values());
    }

    // Retornar conquistas com progresso do usuário
    return Array.from(this.achievements.values()).map((achievement) => {
      const userAchievement = profile.badges.find(
        (badge) => badge.id === achievement.id,
      );
      return userAchievement || achievement;
    });
  }

  /**
   * Obtém desafios ativos
   */
  getChallenges(userId?: string): Challenge[] {
    if (!userId) {
      return Array.from(this.challenges.values());
    }

    // Implementar filtros por usuário
    return Array.from(this.challenges.values());
  }

  /**
   * Configura sistema de gamificação
   */
  configure(config: Partial<GamificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Exporta dados de gamificação
   */
  exportData(userId?: string): any {
    if (userId) {
      const profile = this.userProfiles.get(userId);
      return {
        profile,
        achievements: profile?.badges || [],
        events: this.events.filter((event) => event.userId === userId),
      };
    }

    return {
      profiles: Object.fromEntries(this.userProfiles),
      achievements: Object.fromEntries(this.achievements),
      challenges: Object.fromEntries(this.challenges),
      leaderboard: this.leaderboard,
      events: this.events,
    };
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
