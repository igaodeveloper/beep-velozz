// src/config/envConfig.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  environment: Environment;
  apiBaseUrl: string;
  apiToken: string;
  firebaseConfig: FirebaseConfig;
  enableLogging: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  cache: {
    sessionDuration: number;
    apiCacheDuration: number;
    driversCacheDuration: number;
  };
  performance: {
    maxConcurrentAnimations: number;
    maxHistoryItems: number;
    debounceMs: number;
  };
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Get environment from build-time variable
const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'production';
  return env as Environment;
};

// Get Firebase config from environment variables
const getFirebaseConfig = (): FirebaseConfig => ({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'beepvelozz.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'beepvelozz',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'beepvelozz.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
});

// Validate required environment variables
const validateConfig = (env: Environment) => {
  const requiredVars = ['EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_API_TOKEN'];
  
  if (env === 'production') {
    const missing = requiredVars.filter(
      (varName) => !process.env[varName as keyof NodeJS.ProcessEnv]
    );

    if (missing.length > 0) {
      throw new Error(
        `❌ CRITICAL: Missing required environment variables in production: ${missing.join(', ')}\n` +
        `Please set these in your .env or build configuration.`
      );
    }
  }
};

// Base configuration
const baseConfig: Omit<EnvironmentConfig, 'environment'> = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://app.logmanager.com.br/api',
  apiToken: process.env.EXPO_PUBLIC_API_TOKEN || '',
  firebaseConfig: getFirebaseConfig(),
  enableLogging: false,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  cache: {
    sessionDuration: 24 * 60 * 60 * 1000, // 24 horas
    apiCacheDuration: 5 * 60 * 1000, // 5 minutos
    driversCacheDuration: 30 * 60 * 1000, // 30 minutos
  },
  performance: {
    maxConcurrentAnimations: 10,
    maxHistoryItems: 5000,
    debounceMs: 150,
  },
};

// Environment-specific overrides
const envConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    enableLogging: true,
    enableCrashReporting: false,
    enablePerformanceMonitoring: false,
    cache: {
      sessionDuration: 1 * 60 * 60 * 1000, // 1 hora
      apiCacheDuration: 2 * 60 * 1000, // 2 minutos
      driversCacheDuration: 5 * 60 * 1000, // 5 minutos
    },
  },
  staging: {
    enableLogging: true,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    cache: {
      sessionDuration: 12 * 60 * 60 * 1000, // 12 horas
      apiCacheDuration: 3 * 60 * 1000, // 3 minutos
      driversCacheDuration: 15 * 60 * 1000, // 15 minutos
    },
  },
  production: {
    enableLogging: false,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    cache: {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 horas
      apiCacheDuration: 5 * 60 * 1000, // 5 minutos
      driversCacheDuration: 30 * 60 * 1000, // 30 minutos
    },
  },
};

// Create final configuration
export const createEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getEnvironment();
  
  // Validate configuration
  validateConfig(environment);
  
  const config: EnvironmentConfig = {
    environment,
    ...baseConfig,
    ...envConfigs[environment],
  } as EnvironmentConfig;

  // Log configuration summary (in dev only)
  if (config.enableLogging) {
    console.log('📋 Environment Configuration:', {
      environment: config.environment,
      platform: Platform.OS,
      apiBase: config.apiBaseUrl.replace(/\/api$/, '/***'),
      firebaseProject: config.firebaseConfig.projectId,
      logging: config.enableLogging,
      crashReporting: config.enableCrashReporting,
      performanceMonitoring: config.enablePerformanceMonitoring,
    });
  }

  return config;
};

// Singleton instance
export const envConfig = createEnvironmentConfig();

// Export individual helpers
export const isDevelopment = () => envConfig.environment === 'development';
export const isStaging = () => envConfig.environment === 'staging';
export const isProduction = () => envConfig.environment === 'production';

export default envConfig;
