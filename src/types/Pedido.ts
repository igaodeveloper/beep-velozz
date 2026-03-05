// types/Pedido.ts

import { PedidoType } from '../config/apiConfig';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
}

export interface Entrega {
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  transportadora?: string;
  codigoRastreamento?: string;
}

export interface StatusPedido {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
}

export interface Pedido {
  id: string;
  codigo: string;
  tipo: PedidoType;
  cliente: Cliente;
  entrega: Entrega;
  status: StatusPedido;
  dataCriacao: string;
  dataAtualizacao: string;
  valorTotal: number;
  itens: ItemPedido[];
  observacoes?: string;
}

export interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface PedidoResponse {
  pedido: Pedido;
  encontrado: boolean;
  mensagem?: string;
}

export interface ListaPedidosResponse {
  pedidos: Pedido[];
  total: number;
  pagina: number;
  limite: number;
}