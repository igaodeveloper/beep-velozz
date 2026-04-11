/**
 * Gamification System Types
 * Tipos para sistema de gamificação e engajamento
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "speed" | "accuracy" | "streak" | "volume" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  requirements: {
    type: string;
    value: number;
    condition?: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  experience: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  rank: string;
  badges: Achievement[];
  statistics: {
    totalScans: number;
    totalSessions: number;
    averageAccuracy: number;
    averageSpeed: number;
    totalTime: number;
    favoriteType: string;
  };
  preferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    theme: string;
  };
  createdAt: number;
  lastActiveAt: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  level: number;
  rank: number;
  change: "up" | "down" | "same";
  statistics: {
    totalScans: number;
    accuracy: number;
    speed: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "special";
  category: "scans" | "accuracy" | "speed" | "streak";
  requirements: {
    type: string;
    target: number;
    timeframe?: number;
  };
  rewards: {
    points: number;
    experience: number;
    badge?: Achievement;
  };
  startDate: number;
  endDate: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface GameEvent {
  id: string;
  type:
    | "scan"
    | "session_complete"
    | "achievement_unlock"
    | "level_up"
    | "streak_milestone";
  timestamp: number;
  userId: string;
  data: {
    points?: number;
    experience?: number;
    achievement?: Achievement;
    level?: number;
    streak?: number;
    [key: string]: any;
  };
}

export interface GamificationConfig {
  enableAchievements: boolean;
  enableLeaderboard: boolean;
  enableChallenges: boolean;
  enableStreaks: boolean;
  enableNotifications: boolean;
  pointsPerScan: number;
  experiencePerScan: number;
  streakBonusMultiplier: number;
  levelThresholds: number[];
  rankNames: string[];
}

export interface StreakData {
  current: number;
  best: number;
  lastScanDate: number;
  history: {
    date: number;
    scans: number;
    maintained: boolean;
  }[];
}

export interface Reward {
  id: string;
  type: "points" | "experience" | "badge" | "title" | "avatar";
  value: number | string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}
