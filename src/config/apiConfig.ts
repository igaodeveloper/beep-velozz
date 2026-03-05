// src/config/apiConfig.ts

export const API_CONFIG = {
  BASE_URL: 'https://app.logmanager.com.br/api',
  TOKEN: 'ciU5BsWP0mPOBhVyxSA6xBw5MOBJua1nCsHUQVuZ6u09NTJwgoJfx2PsI1urZmk9XHjmr5XIabI77CC3POgcTLPrKMBQ5IR1baXc0uaQYxZaJgMxwTj1G2J0LSptSZqSSgphXFBDmLYVpXyKP5LRn4ZPTciV9XQIsr6xAxUQwK2ZGraIuOAHakSBZkr761e1ddedcce8a',
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