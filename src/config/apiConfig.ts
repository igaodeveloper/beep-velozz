// src/config/apiConfig.ts
import Constants from 'expo-constants';

// Load from environment variables (.env or build-time config)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || Constants.expoConfig?.extra?.apiBaseUrl || 'https://app.logmanager.com.br/api';
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || Constants.expoConfig?.extra?.apiToken;

// Validate token in production
if (!API_TOKEN && process.env.NODE_ENV === 'production') {
  throw new Error('❌ CRITICAL: API_TOKEN is not configured. Set EXPO_PUBLIC_API_TOKEN in your .env file.');
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TOKEN: API_TOKEN || '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
} as const;

export const PEDIDO_TYPES = {
  SHOPEE: 'SHOPEE',
  MERCADO_LIVRE: 'MERCADO_LIVRE',
  LOGMANAGER: 'LOGMANAGER',
  AVULSO: 'AVULSO',
} as const;

export type PedidoType = typeof PEDIDO_TYPES[keyof typeof PEDIDO_TYPES];