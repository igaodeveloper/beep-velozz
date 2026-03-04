/**
 * Scanner Industrial - Controle de Limite
 * Gerencia limites por tipo de pacote
 * Responsável pelo bloqueio absoluto após limite
 */

import { PackageType } from '@/types/scanner';

/**
 * Configuração de limite para um tipo de pacote
 */
interface LimitConfig {
  type: PackageType;
  maxScans: number;
}

/**
 * Classe responsável pelo controle de limite
 * Implementa lógica segura de contagem com garantias:
 * - Contador interno seguro
 * - Bloqueio absoluto ao atingir limite
 * - Método para verificar se limite foi atingido
 */
export class ScanLimitController {
  private limits: Map<PackageType, number>;
  private scanCounts: Map<PackageType, number>;
  private limitReachedTypes: Set<PackageType>;

  constructor(config: {
    shopee: number;
    mercado_livre: number;
    avulso: number;
  }) {
    this.limits = new Map([
      ['shopee', config.shopee],
      ['mercado_livre', config.mercado_livre],
      ['avulso', config.avulso],
      ['unknown', 0], // Unknown nunca tem limite (ou pode ser 0)
    ]);

    this.scanCounts = new Map([
      ['shopee', 0],
      ['mercado_livre', 0],
      ['avulso', 0],
      ['unknown', 0],
    ]);

    this.limitReachedTypes = new Set();
  }

  /**
   * Tenta incrementar o contador para um tipo
   * @returns true se conseguiu incrementar, false se limite foi atingido
   */
  tryIncrement(type: PackageType): boolean {
    // Se já atingiu limite, não incremente
    if (this.limitReachedTypes.has(type)) {
      return false;
    }

    const currentCount = this.scanCounts.get(type) ?? 0;
    const limit = this.limits.get(type) ?? 0;

    // Se vai atingir o limite
    if (currentCount >= limit) {
      this.limitReachedTypes.add(type);
      return false;
    }

    // Incrementa de forma segura
    this.scanCounts.set(type, currentCount + 1);
    return true;
  }

  /**
   * Verifica se o limite foi atingido para um tipo
   */
  hasLimitReached(type: PackageType): boolean {
    return this.limitReachedTypes.has(type);
  }

  /**
   * Obtém contagem atual de um tipo
   */
  getCount(type: PackageType): number {
    return this.scanCounts.get(type) ?? 0;
  }

  /**
   * Obtém limite de um tipo
   */
  getLimit(type: PackageType): number {
    return this.limits.get(type) ?? 0;
  }

  /**
   * Obtém porcentagem de preenchimento (0-100)
   */
  getProgress(type: PackageType): number {
    const limit = this.getLimit(type);
    if (limit === 0) return 0;

    const count = this.getCount(type);
    return Math.round((count / limit) * 100);
  }

  /**
   * Verifica se ainda há espaço para um tipo
   */
  hasSpace(type: PackageType): boolean {
    return !this.hasLimitReached(type) && this.getCount(type) < this.getLimit(type);
  }

  /**
   * Obtém todos os tipos que atingiram limite
   */
  getLimitReachedTypes(): PackageType[] {
    return Array.from(this.limitReachedTypes);
  }

  /**
   * Obtém statísticas de contagem
   */
  getStats() {
    return {
      shopee: {
        count: this.getCount('shopee'),
        limit: this.getLimit('shopee'),
        progress: this.getProgress('shopee'),
        reached: this.hasLimitReached('shopee'),
      },
      mercado_livre: {
        count: this.getCount('mercado_livre'),
        limit: this.getLimit('mercado_livre'),
        progress: this.getProgress('mercado_livre'),
        reached: this.hasLimitReached('mercado_livre'),
      },
      avulso: {
        count: this.getCount('avulso'),
        limit: this.getLimit('avulso'),
        progress: this.getProgress('avulso'),
        reached: this.hasLimitReached('avulso'),
      },
    };
  }

  /**
   * Reset completo do controlador de limite
   */
  reset(): void {
    this.scanCounts.clear();
    this.limitReachedTypes.clear();

    // Reinicializa contadores para zero
    this.scanCounts.set('shopee', 0);
    this.scanCounts.set('mercado_livre', 0);
    this.scanCounts.set('avulso', 0);
    this.scanCounts.set('unknown', 0);
  }
}
