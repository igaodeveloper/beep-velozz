// src/index.ts

// API
export { default as axiosClient, retryRequest } from './api/axiosClient';
export { LogManagerApi } from './api/logmanagerApi';

// Services
export { PedidosService } from './services/pedidosService';

// Hooks
export { usePedidoScanner } from './hooks/usePedidoScanner';

// Types
export type {
  Pedido,
  Cliente,
  Entrega,
  StatusPedido,
  ItemPedido,
  PedidoResponse,
  ListaPedidosResponse,
} from './types/Pedido';

// Utils
export { ScannerParser } from './utils/scannerParser';
export type { TipoPedido, ParsedCode } from './utils/scannerParser';
export { PedidoValidator } from './utils/pedidoValidator';

// Config
export { API_CONFIG, PEDIDO_TYPES } from './config/apiConfig';
export type { PedidoType } from './config/apiConfig';