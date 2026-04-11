/**
 * Constantes da Aplicação Beep Velozz
 * Centralização de valores mágicos e configurações
 */

export const APP_CONFIG = {
  // Performance
  ANIMATION_DURATIONS: {
    FAST: 120,
    NORMAL: 200,
    SLOW: 300,
  },

  // Cache
  CACHE_TTL: {
    SHORT: 60 * 1000, // 1 minuto
    MEDIUM: 5 * 60 * 1000, // 5 minutos
    LONG: 30 * 60 * 1000, // 30 minutos
  },

  // Debounce delays
  DEBOUNCE_DELAYS: {
    INPUT: 300,
    SEARCH: 500,
    BUTTON: 100,
  },

  // Scanner
  SCANNER_CONFIG: {
    MIN_SCAN_INTERVAL: 1000, // 1 segundo entre scans
    MAX_RETRY_ATTEMPTS: 3,
    SOUND_DELAY: 80,
  },

  // Storage
  STORAGE_KEYS: {
    SESSIONS: "logmanager_sessions",
    THEME: "theme-preference",
    USER_PREFERENCES: "user_preferences",
    SCANNER_SETTINGS: "scanner_settings",
  },

  // Package values (centralizado)
  PACKAGE_VALUES: {
    SHOPEE: 6,
    MERCADO_LIVRE: 8,
    AVULSO: 8,
  },

  // Limits
  MAX_SESSIONS_HISTORY: 1000,
  MAX_PACKAGES_PER_SESSION: 500,

  // UI
  LOADING_TIMEOUTS: {
    SHORT: 2000,
    NORMAL: 5000,
    LONG: 10000,
  },
} as const;

// Exportar tipos derivados
export type AnimationDuration = keyof typeof APP_CONFIG.ANIMATION_DURATIONS;
export type CacheTTL = keyof typeof APP_CONFIG.CACHE_TTL;
export type DebounceDelay = keyof typeof APP_CONFIG.DEBOUNCE_DELAYS;
