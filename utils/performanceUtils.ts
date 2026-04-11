/**
 * Utilitários de Performance Otimizados
 * Cache, memoização e otimizações para o Beep Velozz
 */

import { Session, ScannedPackage } from "@/types/session";

// Interface para cache genérico
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
}

class PerformanceCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache global
const performanceCache = new PerformanceCache();

// Memoização de cálculos pesados
export const memoizedCalculations = {
  // Cache para métricas de sessão
  sessionMetrics: new Map<string, any>(),

  // Função memoizada para calcular métricas
  getSessionMetrics: (packages: ScannedPackage[]) => {
    const cacheKey = packages
      .map((p) => p.id)
      .sort()
      .join("|");

    if (memoizedCalculations.sessionMetrics.has(cacheKey)) {
      return memoizedCalculations.sessionMetrics.get(cacheKey);
    }

    // Calcular métricas (implementação otimizada)
    const shopeePackages = packages.filter((p) => p.type === "shopee");
    const mercadoLivrePackages = packages.filter(
      (p) => p.type === "mercado_livre",
    );
    const avulsoPackages = packages.filter((p) => p.type === "avulso");

    const metrics = {
      shopee: shopeePackages.length,
      mercadoLivre: mercadoLivrePackages.length,
      avulsos: avulsoPackages.length,
      total: packages.length,
      valueShopee: shopeePackages.reduce((acc, p) => acc + (p.value || 6), 0),
      valueMercadoLivre: mercadoLivrePackages.reduce(
        (acc, p) => acc + (p.value || 8),
        0,
      ),
      valueAvulsos: avulsoPackages.reduce((acc, p) => acc + (p.value || 8), 0),
      valueTotal: packages.reduce((acc, p) => acc + (p.value || 0), 0),
    };

    memoizedCalculations.sessionMetrics.set(cacheKey, metrics);
    return metrics;
  },

  // Limpar cache de métricas
  clearSessionMetricsCache: () => {
    memoizedCalculations.sessionMetrics.clear();
  },
};

// Otimização de renderização
export const renderOptimizations = {
  // Debounce para inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number,
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  // Throttle para eventos frequentes
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Otimizações de storage
export const storageOptimizations = {
  // Batch operations
  batchUpdate: async <T>(key: string, updates: Partial<T>[]): Promise<void> => {
    // Implementação para atualizações em lote
    // Reduz número de operações de I/O
  },

  // Compressão de dados para storage
  compressData: (data: any): string => {
    return JSON.stringify(data);
  },

  // Descompressão de dados do storage
  decompressData: <T>(compressed: string): T => {
    return JSON.parse(compressed);
  },
};

// Monitoramento de performance
export const performanceMonitor = {
  // Medir tempo de execução
  measureTime: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Memory usage tracking (compatível com React Native)
  trackMemoryUsage: () => {
    // React Native não tem performance.memory como browsers
    // Implementação alternativa para tracking de memória
    try {
      // @ts-ignore - React Native specific memory tracking
      if (global.nativePerformance?.memory) {
        // @ts-ignore
        const memory = global.nativePerformance.memory;
        console.log(
          "[Memory] Used:",
          `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        );
        console.log(
          "[Memory] Total:",
          `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        );
      } else {
        console.log("[Memory] Memory tracking não disponível nesta plataforma");
      }
    } catch (error) {
      console.log("[Memory] Erro ao track memory usage:", error);
    }
  },
};

// Limpeza automática de cache
setInterval(() => {
  performanceCache.cleanup();
}, 60000); // Limpar a cada minuto

export { performanceCache };
