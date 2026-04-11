// src/api/logmanagerApi.ts

import axiosClient, { retryRequest } from "./axiosClient";
import { Pedido, PedidoResponse, ListaPedidosResponse } from "../types/Pedido";

export class LogManagerApi {
  // Buscar pedido por código
  static async buscarPedidoPorCodigo(codigo: string): Promise<PedidoResponse> {
    return retryRequest(async () => {
      const response = await axiosClient.get<PedidoResponse>(
        `/pedidos/${codigo}`,
      );
      return response.data;
    });
  }

  // Listar todos os pedidos
  static async listarPedidos(
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    return retryRequest(async () => {
      const response = await axiosClient.get<ListaPedidosResponse>("/pedidos", {
        params: { pagina, limite },
      });
      return response.data;
    });
  }

  // Buscar pedidos por status
  static async buscarPedidosPorStatus(
    status: string,
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    return retryRequest(async () => {
      const response = await axiosClient.get<ListaPedidosResponse>(
        "/pedidos/status",
        {
          params: { status, pagina, limite },
        },
      );
      return response.data;
    });
  }

  // Buscar pedidos por cliente
  static async buscarPedidosPorCliente(
    clienteId: string,
    pagina = 1,
    limite = 50,
  ): Promise<ListaPedidosResponse> {
    return retryRequest(async () => {
      const response = await axiosClient.get<ListaPedidosResponse>(
        "/pedidos/cliente",
        {
          params: { clienteId, pagina, limite },
        },
      );
      return response.data;
    });
  }

  // Atualizar status do pedido
  static async atualizarStatusPedido(
    pedidoId: string,
    statusId: string,
  ): Promise<Pedido> {
    return retryRequest(async () => {
      const response = await axiosClient.put<Pedido>(
        `/pedidos/${pedidoId}/status`,
        {
          statusId,
        },
      );
      return response.data;
    });
  }

  // Criar novo pedido (para pedidos avulsos)
  static async criarPedido(pedido: Partial<Pedido>): Promise<Pedido> {
    return retryRequest(async () => {
      const response = await axiosClient.post<Pedido>("/pedidos", pedido);
      return response.data;
    });
  }
}
