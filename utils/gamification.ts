/**
 * Gamification System
 * Sistema de gamificação para engajamento e motivação de operadores
 */

import { Session, OperatorStats } from '@/types/session';
import { PackageType } from '@/types/scanner';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'milestone' | 'special';
  points: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LeaderboardEntry {
  operatorId: string;
  operatorName: string;
  points: number;
  rank: number;
  change: number; // mudança no ranking
  badges: string[];
  stats: {
    totalPackages: number;
    avgSpeed: number;
    accuracy: number;
    streak: number;
  };
}

export interface GamificationEvent {
  id: string;
  type: 'session_complete' | 'milestone_reached' | 'achievement_unlocked' | 'streak_maintained' | 'speed_record';
  operatorId: string;
  points: number;
  message: string;
  timestamp: number;
  metadata?: any;
}

export interface GamificationConfig {
  enablePoints: boolean;
  enableAchievements: boolean;
  enableLeaderboard: boolean;
  enableStreaks: boolean;
  pointsPerPackage: number;
  speedBonusMultiplier: number;
  accuracyBonusMultiplier: number;
  streakBonusMultiplier: number;
}

class GamificationEngine {
  private config: GamificationConfig;
  private achievements: Achievement[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private events: GamificationEvent[] = [];
  private operatorData: Map<string, any> = new Map();

  constructor(config: Partial<GamificationConfig> = {}) {
    this.config = {
      enablePoints: true,
      enableAchievements: true,
      enableLeaderboard: true,
      enableStreaks: true,
      pointsPerPackage: 10,
      speedBonusMultiplier: 1.5,
      accuracyBonusMultiplier: 2.0,
      streakBonusMultiplier: 1.8,
      ...config,
    };

    this.initializeAchievements();
  }

  /**
   * Inicializa conquistas disponíveis
   */
  private initializeAchievements(): void {
    this.achievements = [
      // Conquistas de Velocidade
      {
        id: 'speed_demon',
        title: '🚀 Demônio da Velocidade',
        description: 'Escaneie 100 pacotes em menos de 5 minutos',
        icon: 'flash',
        category: 'speed',
        points: 500,
        progress: 0,
        maxProgress: 100,
        rarity: 'rare',
      },
      {
        id: 'lightning_fast',
        title: '⚡ Veloz como um Relâmpago',
        description: 'Mantenha média de 20+ pacotes/minuto',
        icon: 'bolt',
        category: 'speed',
        points: 300,
        progress: 0,
        maxProgress: 1,
        rarity: 'common',
      },
      {
        id: 'speed_master',
        title: '💨 Mestre da Velocidade',
        description: 'Alcance 30 pacotes/minuto em uma sessão',
        icon: 'wind',
        category: 'speed',
        points: 1000,
        progress: 0,
        maxProgress: 1,
        rarity: 'epic',
      },

      // Conquistas de Precisão
      {
        id: 'perfectionist',
        title: '🎯 Perfeccionista',
        description: 'Complete 10 sessões sem divergências',
        icon: 'target',
        category: 'accuracy',
        points: 750,
        progress: 0,
        maxProgress: 10,
        rarity: 'rare',
      },
      {
        id: 'eagle_eye',
        title: '🦅 Olho de Águia',
        description: 'Alcance 99% de acurácia em 50 sessões',
        icon: 'eye',
        category: 'accuracy',
        points: 600,
        progress: 0,
        maxProgress: 50,
        rarity: 'epic',
      },
      {
        id: 'flawless',
        title: '💎 Impecável',
        description: '100 sessões consecutivas sem erros',
        icon: 'diamond',
        category: 'accuracy',
        points: 2000,
        progress: 0,
        maxProgress: 100,
        rarity: 'legendary',
      },

      // Conquistas de Consistência
      {
        id: 'daily_hustler',
        title: '📅 Trabalhador Diário',
        description: 'Complete sessões por 7 dias consecutivos',
        icon: 'calendar',
        category: 'consistency',
        points: 400,
        progress: 0,
        maxProgress: 7,
        rarity: 'common',
      },
      {
        id: 'marathon_runner',
        title: '🏃 Maratonista',
        description: 'Mantenha streak de 30 dias',
        icon: 'medal',
        category: 'consistency',
        points: 1500,
        progress: 0,
        maxProgress: 30,
        rarity: 'epic',
      },
      {
        id: 'iron_will',
        title: '🛡️ Vontade de Ferro',
        description: '365 dias de atividade consecutivos',
        icon: 'shield',
        category: 'consistency',
        points: 5000,
        progress: 0,
        maxProgress: 365,
        rarity: 'legendary',
      },

      // Conquistas de Marco
      {
        id: 'first_1000',
        title: '🎉 Primeiro Mil',
        description: 'Escaneie seu pacote número 1000',
        icon: 'trophy',
        category: 'milestone',
        points: 200,
        progress: 0,
        maxProgress: 1000,
        rarity: 'common',
      },
      {
        id: 'pack_master',
        title: '📦 Mestre dos Pacotes',
        description: 'Escaneie 10.000 pacotes',
        icon: 'package',
        category: 'milestone',
        points: 800,
        progress: 0,
        maxProgress: 10000,
        rarity: 'rare',
      },
      {
        id: 'legend',
        title: '👑 Lenda',
        description: 'Escaneie 100.000 pacotes',
        icon: 'crown',
        category: 'milestone',
        points: 3000,
        progress: 0,
        maxProgress: 100000,
        rarity: 'legendary',
      },

      // Conquistas Especiais
      {
        id: 'variety_king',
        title: '🌂 Rei da Variedade',
        description: 'Escaneie todos os tipos de pacotes em uma sessão',
        icon: 'umbrella',
        category: 'special',
        points: 350,
        progress: 0,
        maxProgress: 3,
        rarity: 'rare',
      },
      {
        id: 'night_owl',
        title: '🦉 Coruja Noturna',
        description: 'Complete 10 sessões durante a noite',
        icon: 'moon',
        category: 'special',
        points: 450,
        progress: 0,
        maxProgress: 10,
        rarity: 'rare',
      },
      {
        id: 'early_bird',
        title: '🐦 Pássaro Matinal',
        description: 'Complete 10 sessões antes das 8h',
        icon: 'sunny',
        category: 'special',
        points: 450,
        progress: 0,
        maxProgress: 10,
        rarity: 'rare',
      },
    ];
  }

  /**
   * Processa uma sessão completa e calcula pontos
   */
  processSession(session: Session): GamificationEvent[] {
    const events: GamificationEvent[] = [];
    const operatorId = session.operatorName;

    // Inicializa dados do operador se necessário
    if (!this.operatorData.has(operatorId)) {
      this.operatorData.set(operatorId, {
        totalPackages: 0,
        totalSessions: 0,
        totalPoints: 0,
        streak: 0,
        lastActiveDate: null,
        achievements: [],
        speedRecords: [],
        accuracyHistory: [],
      });
    }

    const operatorStats = this.operatorData.get(operatorId);

    // Calcula pontos básicos
    const basePoints = session.packages.length * this.config.pointsPerPackage;
    
    // Bônus de velocidade
    const sessionDuration = session.completedAt 
      ? (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60)
      : 0;
    const speedBonus = sessionDuration > 0 && sessionDuration < 10 
      ? basePoints * this.config.speedBonusMultiplier 
      : 0;

    // Bônus de acurácia
    const accuracyBonus = !session.hasDivergence 
      ? basePoints * this.config.accuracyBonusMultiplier 
      : 0;

    // Bônus de streak
    const streakBonus = this.calculateStreakBonus(operatorId, session);

    const totalPoints = basePoints + speedBonus + accuracyBonus + streakBonus;

    // Atualiza estatísticas do operador
    operatorStats.totalPackages += session.packages.length;
    operatorStats.totalSessions += 1;
    operatorStats.totalPoints += totalPoints;
    
    if (sessionDuration > 0) {
      operatorStats.speedRecords.push(session.packages.length / sessionDuration);
    }
    
    operatorStats.accuracyHistory.push(session.hasDivergence ? 0 : 1);

    // Gera eventos
    events.push({
      id: `session_${session.id}_${Date.now()}`,
      type: 'session_complete',
      operatorId,
      points: totalPoints,
      message: `Sessão completa! +${totalPoints} pontos`,
      timestamp: Date.now(),
      metadata: {
        sessionId: session.id,
        packageCount: session.packages.length,
        duration: sessionDuration,
        hasDivergence: session.hasDivergence,
      },
    });

    // Verifica conquistas
    const unlockedAchievements = this.checkAchievements(operatorId, session);
    unlockedAchievements.forEach(achievement => {
      events.push({
        id: `achievement_${achievement.id}_${Date.now()}`,
        type: 'achievement_unlocked',
        operatorId,
        points: achievement.points,
        message: `🏆 Conquista desbloqueada: ${achievement.title}! +${achievement.points} pontos`,
        timestamp: Date.now(),
        metadata: { achievement },
      });
    });

    // Verifica marcos
    this.checkMilestones(operatorId, session).forEach(milestone => {
      events.push(milestone);
    });

    // Atualiza leaderboard
    this.updateLeaderboard();

    return events;
  }

  /**
   * Calcula bônus de streak
   */
  private calculateStreakBonus(operatorId: string, session: Session): number {
    const operatorStats = this.operatorData.get(operatorId);
    const today = new Date().toDateString();
    const lastActive = operatorStats.lastActiveDate;

    if (lastActive === today) {
      return 0; // Já recebeu bônus hoje
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (lastActive === yesterday) {
      operatorStats.streak += 1;
    } else if (lastActive !== today) {
      operatorStats.streak = 1;
    }

    operatorStats.lastActiveDate = today;

    if (operatorStats.streak >= 7) {
      return this.config.pointsPerPackage * session.packages.length * this.config.streakBonusMultiplier;
    }

    return 0;
  }

  /**
   * Verifica conquistas desbloqueadas
   */
  private checkAchievements(operatorId: string, session: Session): Achievement[] {
    const operatorStats = this.operatorData.get(operatorId);
    const unlocked: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (operatorStats.achievements.includes(achievement.id)) return;

      let progress = 0;
      let shouldUnlock = false;

      switch (achievement.id) {
        case 'speed_demon':
          const duration = session.completedAt 
            ? (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60)
            : 0;
          if (duration > 0 && duration < 5 && session.packages.length >= 100) {
            shouldUnlock = true;
          }
          progress = Math.min(session.packages.length, achievement.maxProgress);
          break;

        case 'lightning_fast':
          const avgSpeed = operatorStats.speedRecords.length > 0
            ? operatorStats.speedRecords.reduce((sum: number, speed: number) => sum + speed, 0) / operatorStats.speedRecords.length
            : 0;
          if (avgSpeed >= 20) {
            shouldUnlock = true;
          }
          progress = avgSpeed >= 20 ? 1 : avgSpeed / 20;
          break;

        case 'perfectionist':
          const perfectSessions = operatorStats.accuracyHistory.filter((a: number) => a === 1).length;
          progress = perfectSessions;
          shouldUnlock = perfectSessions >= 10;
          break;

        case 'first_1000':
          progress = operatorStats.totalPackages;
          shouldUnlock = operatorStats.totalPackages >= 1000;
          break;

        case 'daily_hustler':
          progress = operatorStats.streak;
          shouldUnlock = operatorStats.streak >= 7;
          break;

        case 'variety_king':
          const packageTypes = new Set(session.packages.map(p => p.type)).size;
          progress = packageTypes;
          shouldUnlock = packageTypes >= 3;
          break;

        // Adicionar mais verificações conforme necessário...
      }

      achievement.progress = progress;

      if (shouldUnlock) {
        achievement.unlockedAt = Date.now();
        operatorStats.achievements.push(achievement.id);
        unlocked.push(achievement);
      }
    });

    return unlocked;
  }

  /**
   * Verifica marcos especiais
   */
  private checkMilestones(operatorId: string, session: Session): GamificationEvent[] {
    const events: GamificationEvent[] = [];
    const operatorStats = this.operatorData.get(operatorId);

    // Marco de pacotes
    const milestones = [100, 500, 1000, 5000, 10000, 50000];
    milestones.forEach(milestone => {
      if (operatorStats.totalPackages === milestone) {
        events.push({
          id: `milestone_packages_${milestone}_${Date.now()}`,
          type: 'milestone_reached',
          operatorId,
          points: milestone * 2,
          message: `🎉 Marco alcançado: ${milestone} pacotes! +${milestone * 2} pontos`,
          timestamp: Date.now(),
          metadata: { type: 'packages', value: milestone },
        });
      }
    });

    // Marco de streak
    if (operatorStats.streak === 30 || operatorStats.streak === 100 || operatorStats.streak === 365) {
      events.push({
        id: `milestone_streak_${operatorStats.streak}_${Date.now()}`,
        type: 'streak_maintained',
        operatorId,
        points: operatorStats.streak * 10,
        message: `🔥 Streak de ${operatorStats.streak} dias! +${operatorStats.streak * 10} pontos`,
        timestamp: Date.now(),
        metadata: { streak: operatorStats.streak },
      });
    }

    return events;
  }

  /**
   * Atualiza o leaderboard
   */
  private updateLeaderboard(): void {
    const entries: LeaderboardEntry[] = [];

    this.operatorData.forEach((stats, operatorId) => {
      const avgSpeed = stats.speedRecords.length > 0
        ? stats.speedRecords.reduce((sum: number, speed: number) => sum + speed, 0) / stats.speedRecords.length
        : 0;

      const accuracy = stats.accuracyHistory.length > 0
        ? (stats.accuracyHistory.filter((a: number) => a === 1).length / stats.accuracyHistory.length) * 100
        : 0;

      entries.push({
        operatorId,
        operatorName: operatorId,
        points: stats.totalPoints,
        rank: 0, // Será calculado depois
        change: 0, // Será calculado comparando com ranking anterior
        badges: stats.achievements.slice(0, 3), // Top 3 conquistas
        stats: {
          totalPackages: stats.totalPackages,
          avgSpeed,
          accuracy,
          streak: stats.streak,
        },
      });
    });

    // Ordena por pontos e atribui ranks
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;
  }

  /**
   * Obtém o leaderboard
   */
  getLeaderboard(limit: number = 10): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  /**
   * Obtém conquistas de um operador
   */
  getOperatorAchievements(operatorId: string): Achievement[] {
    const operatorStats = this.operatorData.get(operatorId);
    if (!operatorStats) return [];

    return this.achievements.filter(a => operatorStats.achievements.includes(a.id));
  }

  /**
   * Obtém estatísticas de um operador
   */
  getOperatorStats(operatorId: string): any {
    return this.operatorData.get(operatorId) || {
      totalPackages: 0,
      totalSessions: 0,
      totalPoints: 0,
      streak: 0,
      lastActiveDate: null,
      achievements: [],
      speedRecords: [],
      accuracyHistory: [],
    };
  }

  /**
   * Obtém todas as conquistas disponíveis
   */
  getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }

  /**
   * Obtém eventos recentes
   */
  getRecentEvents(limit: number = 20): GamificationEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Calcula nível de um operador
   */
  calculateOperatorLevel(operatorId: string): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
    const stats = this.getOperatorStats(operatorId);
    const totalPoints = stats.totalPoints;

    // Fórmula de nível: 1000 * level^1.5
    const getXPForLevel = (level: number) => Math.floor(1000 * Math.pow(level, 1.5));

    let level = 1;
    while (getXPForLevel(level + 1) <= totalPoints) {
      level++;
    }

    const currentXP = totalPoints - getXPForLevel(level - 1);
    const nextLevelXP = getXPForLevel(level) - getXPForLevel(level - 1);
    const progress = nextLevelXP > 0 ? currentXP / nextLevelXP : 0;

    return { level, currentXP, nextLevelXP, progress };
  }

  /**
   * Obtém ranking de um operador
   */
  getOperatorRank(operatorId: string): number {
    const entry = this.leaderboard.find(e => e.operatorId === operatorId);
    return entry ? entry.rank : -1;
  }

  /**
   * Reseta dados de gamificação
   */
  resetData(): void {
    this.operatorData.clear();
    this.leaderboard = [];
    this.events = [];
    this.achievements.forEach(a => {
      a.progress = 0;
      a.unlockedAt = undefined;
    });
  }

  /**
   * Exporta dados para análise
   */
  exportData(): {
    achievements: Achievement[];
    leaderboard: LeaderboardEntry[];
    events: GamificationEvent[];
    operatorData: any;
  } {
    return {
      achievements: [...this.achievements],
      leaderboard: [...this.leaderboard],
      events: [...this.events],
      operatorData: Object.fromEntries(this.operatorData),
    };
  }
}

// Export singleton
export const gamificationEngine = new GamificationEngine();
