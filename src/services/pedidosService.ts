// src/services/pedidosService.ts

import { LogManagerApi } from "../api/logmanagerApi";
import { Pedido, PedidoResponse, ListaPedidosResponse } from "../types/Pedido";
import { API_CONFIG } from "../config/apiConfig";
import { PedidoValidator } from "../utils/pedidoValidator";

export class PedidosService {
  private static cache = new Map<
    string,
    { pedido: Pedido; timestamp: number }
  >();
  private static CACHE_DURATION = API_CONFIG.CACHE_DURATION; // 5 minutos

  // Buscar pedido por código com cache
  static async buscarPedidoPorCodigo(codigo: string): Promise<PedidoResponse> {
    // Verificar cache
    const cached = this.cache.get(codigo);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { pedido: cached.pedido, encontrado: true };
    }

    try {
      const response = await LogManagerApi.buscarPedidoPorCodigo(codigo);

      // Validar e sanitizar o pedido
      const pedidoValidado = response.pedido
        ? PedidoValidator.sanitizePedido(response.pedido)
        : (null as any);

      const responseValidada: PedidoResponse = {
        ...response,
        pedido: pedidoValidado,
      };

      // Salvar no cache se encontrado e válido
      if (responseValidada.encontrado && responseValidada.pedido) {
        this.cache.set(codigo, {
          pedido: responseValidada.pedido,
          timestamp: Date.now(),
        });
      }

      return responseValidada;
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      return {
        pedido: null as any,
        encontrado: false,
        mensagem:
          "Erro ao consultar pedido. Verifique sua conexão e tente novamente.",
      };
    }
  }

  // Listar pedidos
  static async listarPedidos(
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    try {
      return await LogManagerApi.listarPedidos(pagina, limite);
    } catch (error) {
      console.error("Erro ao listar pedidos:", error);
      throw new Error("Erro ao carregar lista de pedidos");
    }
  }

  // Buscar pedidos por status
  static async buscarPedidosPorStatus(
    status: string,
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    try {
      return await LogManagerApi.buscarPedidosPorStatus(status, pagina, limite);
    } catch (error) {
      console.error("Erro ao buscar pedidos por status:", error);
      throw new Error("Erro ao filtrar pedidos por status");
    }
  }

  // Buscar pedidos por cliente
  static async buscarPedidosPorCliente(
    clienteId: string,
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    try {
      return await LogManagerApi.buscarPedidosPorCliente(
        clienteId,
        pagina,
        limite,
      );
    } catch (error) {
      console.error("Erro ao buscar pedidos por cliente:", error);
      throw new Error("Erro ao filtrar pedidos por cliente");
    }
  }

  // Atualizar status do pedido
  static async atualizarStatusPedido(
    pedidoId: string,
    statusId: string,
  ): Promise<Pedido> {
    try {
      const pedido = await LogManagerApi.atualizarStatusPedido(
        pedidoId,
        statusId,
      );

      // Limpar cache relacionado
      this.cache.clear();

      return pedido;
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      throw new Error("Erro ao atualizar status do pedido");
    }
  }

  // Criar novo pedido
  static async criarPedido(pedido: Partial<Pedido>): Promise<Pedido> {
    try {
      return await LogManagerApi.criarPedido(pedido);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      throw new Error("Erro ao criar novo pedido");
    }
  }

  // Limpar cache
  static limparCache(): void {
    this.cache.clear();
  }

  // Obter estatísticas do cache
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
