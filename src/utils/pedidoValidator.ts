// src/utils/pedidoValidator.ts

import { Pedido, Cliente, Entrega, StatusPedido, ItemPedido } from '../types/Pedido';

/**
 * Utilitários para validação de dados de pedidos
 */
export class PedidoValidator {
  /**
   * Valida se um objeto é um pedido válido
   */
  static isValidPedido(obj: any): obj is Pedido {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.codigo === 'string' &&
      typeof obj.tipo === 'string' &&
      this.isValidCliente(obj.cliente) &&
      this.isValidEntrega(obj.entrega) &&
      this.isValidStatus(obj.status) &&
      typeof obj.dataCriacao === 'string' &&
      typeof obj.dataAtualizacao === 'string' &&
      typeof obj.valorTotal === 'number' &&
      Array.isArray(obj.itens) &&
      obj.itens.every((item: any) => this.isValidItemPedido(item))
    );
  }

  /**
   * Valida se um objeto é um cliente válido
   */
  static isValidCliente(obj: any): obj is Cliente {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.nome === 'string'
    );
  }

  /**
   * Valida se um objeto é uma entrega válida
   */
  static isValidEntrega(obj: any): obj is Entrega {
    return (
      obj &&
      typeof obj.endereco === 'string' &&
      typeof obj.cidade === 'string' &&
      typeof obj.estado === 'string' &&
      typeof obj.cep === 'string' &&
      typeof obj.pais === 'string'
    );
  }

  /**
   * Valida se um objeto é um status válido
   */
  static isValidStatus(obj: any): obj is StatusPedido {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.nome === 'string'
    );
  }

  /**
   * Valida se um objeto é um item de pedido válido
   */
  static isValidItemPedido(obj: any): obj is ItemPedido {
    return (
      obj &&
      typeof obj.id === 'string' &&
      typeof obj.nome === 'string' &&
      typeof obj.quantidade === 'number' &&
      typeof obj.precoUnitario === 'number' &&
      typeof obj.total === 'number'
    );
  }

  /**
   * Valida e sanitiza um pedido da API
   */
  static sanitizePedido(data: any): Pedido | null {
    if (!this.isValidPedido(data)) {
      console.warn('Pedido inválido recebido da API:', data);
      return null;
    }

    // Sanitização adicional se necessário
    return {
      ...data,
      valorTotal: Math.max(0, data.valorTotal), // Garante valor não negativo
      itens: data.itens.map((item: any) => ({
        ...item,
        quantidade: Math.max(1, item.quantidade),
        precoUnitario: Math.max(0, item.precoUnitario),
        total: Math.max(0, item.total),
      })),
    };
  }

  /**
   * Valida formato de CEP brasileiro
   */
  static isValidCEP(cep: string): boolean {
    const cepRegex = /^\d{5}-?\d{3}$/;
    return cepRegex.test(cep.replace(/\D/g, ''));
  }

  /**
   * Valida formato de CPF
   */
  static isValidCPF(cpf: string): boolean {
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    return cpfRegex.test(cpf.replace(/\D/g, ''));
  }

  /**
   * Valida formato de CNPJ
   */
  static isValidCNPJ(cnpj: string): boolean {
    const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
    return cnpjRegex.test(cnpj.replace(/\D/g, ''));
  }

  /**
   * Formata CEP para exibição
   */
  static formatCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}`;
    }
    return cep;
  }

  /**
   * Formata CPF para exibição
   */
  static formatCPF(cpf: string): string {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length === 11) {
      return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9)}`;
    }
    return cpf;
  }

  /**
   * Formata CNPJ para exibição
   */
  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length === 14) {
      return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2, 5)}.${cleanCNPJ.slice(5, 8)}/${cleanCNPJ.slice(8, 12)}-${cleanCNPJ.slice(12)}`;
    }
    return cnpj;
  }

  /**
   * Formata documento (CPF ou CNPJ) automaticamente
   */
  static formatDocumento(documento: string): string {
    const cleanDoc = documento.replace(/\D/g, '');
    if (cleanDoc.length === 11) {
      return this.formatCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
      return this.formatCNPJ(cleanDoc);
    }
    return documento;
  }
}