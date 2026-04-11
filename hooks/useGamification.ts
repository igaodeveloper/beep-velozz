/**
 * Hook for Gamification System
 * Hook React para sistema de gamificação
 */

import { useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  Achievement,
  LeaderboardEntry,
  Challenge,
} from "@/types/gamification";
import { gamificationService } from "@/services/gamificationService";

interface UseGamificationOptions {
  userId: string;
  userName: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface GamificationState {
  profile: UserProfile | null;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
  isLoading: boolean;
  error: string | null;
}

export function useGamification({
  userId,
  userName,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
}: UseGamificationOptions) {
  const [state, setState] = useState<GamificationState>({
    profile: null,
    achievements: [],
    leaderboard: [],
    challenges: [],
    isLoading: true,
    error: null,
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadGamificationData();
  }, [userId, userName]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadGamificationData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId]);

  // Carregar dados de gamificação
  const loadGamificationData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Carregar perfil
      const profile = gamificationService.getProfile(userId);

      // Carregar conquistas
      const achievements = gamificationService.getAchievements(userId);

      // Carregar leaderboard
      const leaderboard = gamificationService.getLeaderboard(50);

      // Carregar desafios
      const challenges = gamificationService.getChallenges(userId);

      setState({
        profile,
        achievements,
        leaderboard,
        challenges,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Erro ao carregar dados",
      }));
    }
  }, [userId]);

  // Processar scan
  const processScan = useCallback(
    (packageData: any, accuracy: number, speed: number) => {
      try {
        const result = gamificationService.processScan(
          userId,
          userName,
          packageData,
          accuracy,
          speed,
        );

        // Atualizar estado com novos dados
        loadGamificationData();

        return result;
      } catch (error) {
        console.error("Error processing scan for gamification:", error);
        return null;
      }
    },
    [userId, userName, loadGamificationData],
  );

  // Obter conquistas não desbloqueadas
  const getLockedAchievements = useCallback(() => {
    return state.achievements.filter((achievement) => !achievement.unlockedAt);
  }, [state.achievements]);

  // Obter conquistas desbloqueadas
  const getUnlockedAchievements = useCallback(() => {
    return state.achievements.filter((achievement) => achievement.unlockedAt);
  }, [state.achievements]);

  // Obter desafios ativos
  const getActiveChallenges = useCallback(() => {
    return state.challenges.filter(
      (challenge) => !challenge.completed && !challenge.claimed,
    );
  }, [state.challenges]);

  // Obter desafios completados
  const getCompletedChallenges = useCallback(() => {
    return state.challenges.filter(
      (challenge) => challenge.completed && !challenge.claimed,
    );
  }, [state.challenges]);

  // Obter posição no ranking
  const getLeaderboardPosition = useCallback(() => {
    const userEntry = state.leaderboard.find(
      (entry) => entry.userId === userId,
    );
    return userEntry?.rank || null;
  }, [state.leaderboard, userId]);

  // Calcular progresso para próximo nível
  const getLevelProgress = useCallback(() => {
    if (!state.profile) return { current: 0, next: 0, progress: 0 };

    const currentLevel = state.profile.level;
    const currentExp = state.profile.experience;

    // Thresholds simplificados
    const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

    const currentThreshold = thresholds[currentLevel - 1] || 0;
    const nextThreshold =
      thresholds[currentLevel] || thresholds[thresholds.length - 1];

    const progress =
      ((currentExp - currentThreshold) / (nextThreshold - currentThreshold)) *
      100;

    return {
      current: currentExp - currentThreshold,
      next: nextThreshold - currentThreshold,
      progress: Math.min(progress, 100),
    };
  }, [state.profile]);

  // Formatar experiência
  const formatExperience = useCallback((exp: number) => {
    if (exp >= 1000000) {
      return `${(exp / 1000000).toFixed(1)}M`;
    } else if (exp >= 1000) {
      return `${(exp / 1000).toFixed(1)}K`;
    }
    return exp.toString();
  }, []);

  // Formatar pontos
  const formatPoints = useCallback((points: number) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  }, []);

  // Obter cor de raridade
  const getRarityColor = useCallback((rarity: string) => {
    switch (rarity) {
      case "common":
        return "#94a3b8";
      case "rare":
        return "#4a90e2";
      case "epic":
        return "#9b59b6";
      case "legendary":
        return "#f39c12";
      default:
        return "#94a3b8";
    }
  }, []);

  // Obter insights do perfil
  const getProfileInsights = useCallback(() => {
    if (!state.profile) return [];

    const insights = [];
    const { profile } = state;

    // Insight de nível
    if (profile.level >= 5) {
      insights.push("🌟 Você está entre os melhores operadores!");
    }

    // Insight de sequência
    if (profile.currentStreak >= 7) {
      insights.push("🔥 Sequência impressionante! Continue assim!");
    }

    // Insight de precisão
    if (profile.statistics.averageAccuracy >= 95) {
      insights.push("🎯 Precisão excepcional!");
    }

    // Insight de velocidade
    if (profile.statistics.averageSpeed <= 2) {
      insights.push("⚡ Velocidade de escaneamento impressionante!");
    }

    return insights;
  }, [state.profile]);

  return {
    // Estado
    ...state,

    // Métodos
    loadGamificationData,
    processScan,

    // Getters computados
    getLockedAchievements,
    getUnlockedAchievements,
    getActiveChallenges,
    getCompletedChallenges,
    getLeaderboardPosition,
    getLevelProgress,
    formatExperience,
    formatPoints,
    getRarityColor,
    getProfileInsights,

    // Utilitários
    refresh: loadGamificationData,
  };
}
