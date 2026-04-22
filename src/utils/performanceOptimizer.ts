// src/utils/performanceOptimizer.ts
/**
 * Performance Optimizer - Industrial Grade Optimization
 * Sistema completo de otimização para operacional de alta performance
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { caches } from './advancedCache';
import { ScannedPackage } from '@/types/session';

// Configurações de performance industrial
export const PERFORMANCE_CONFIG = {
  // Debounce timings
  SEARCH_DEBOUNCE: 150,
  INPUT_DEBOUNCE: 100,
  SCROLL_DEBOUNCE: 16, // 60fps
  
  // Batch sizes
  RENDER_BATCH_SIZE: 20,
  CACHE_BATCH_SIZE: 50,
  ANIMATION_BATCH_SIZE: 10,
  
  // Memory limits
  MAX_MEMORY_USAGE: 150 * 1024 * 1024, // 150MB
  CACHE_CLEANUP_INTERVAL: 2 * 60 * 1000, // 2min
  
  // Animation settings
  ANIMATION_DURATION: {
    FAST: 120,
    NORMAL: 200,
    SLOW: 300,
  },
  
  // List optimization
  LIST_CONFIG: {
    initialNumToRender: 15,
    maxToRenderPerBatch: 8,
    updateCellsBatchingPeriod: 50,
    windowSize: 21,
    removeClippedSubviews: true,
  },
};

// Debounce otimizado com cancelamento
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Atualizar callback ref quando mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, deps) as T;
}

// Throttle para 60fps
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 16 // 60fps
): T {
  const inThrottle = useRef(false);
  const lastArgs = useRef<Parameters<T> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    lastArgs.current = args;

    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;

      setTimeout(() => {
        inThrottle.current = false;
        if (lastArgs.current) {
          callback(...lastArgs.current);
          lastArgs.current = null;
        }
      }, limit);
    }
  }, []) as T;
}

// Memoização com cache persistente
export function usePersistentMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheKey: string,
  ttl: number = 5 * 60 * 1000 // 5min
): T {
  // Tentar do cache primeiro
  const cached = caches.ui.get(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Calcular e cachear
  const value = useMemo(factory, deps);
  caches.ui.set(cacheKey, value, ttl);

  return value;
}

// Lazy loading com fallback
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  fallback: T,
  deps: React.DependencyList = []
): [T, boolean, Error | null] {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Usar InteractionManager para não bloquear UI
        await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
        
        const result = await loader();
        
        if (!cancelled && mountedRef.current) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return [data, loading, error];
}

// Batch processing para operações pesadas
export function useBatchProcessor<T, R>(
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = PERFORMANCE_CONFIG.RENDER_BATCH_SIZE
) {
  const processingRef = useRef(false);
  const queueRef = useRef<T[]>([]);

  const process = useCallback(async (items: T[]): Promise<R[]> => {
    if (items.length === 0) return [];

    const results: R[] = [];
    
    // Processar em batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        
        // Yield para UI thread
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        // Continuar com próximo batch
      }
    }

    return results;
  }, [processor, batchSize]);

  const addToQueue = useCallback((item: T) => {
    queueRef.current.push(item);
    
    if (!processingRef.current) {
      processingRef.current = true;
      
      // Processar na próxima interação
      InteractionManager.runAfterInteractions(async () => {
        const items = queueRef.current.splice(0);
        queueRef.current = [];
        
        await process(items);
        processingRef.current = false;
      });
    }
  }, [process]);

  return { process, addToQueue };
}

// Memory monitor
export function useMemoryMonitor() {
  const statsRef = useRef({
    renders: 0,
    memoryUsage: 0,
    lastCleanup: Date.now(),
  });

  const checkMemory = useCallback(() => {
    if (Platform.OS === 'web') {
      const memory = (performance as any).memory;
      if (memory) {
        statsRef.current.memoryUsage = memory.usedJSHeapSize;
      }
    }

    // Auto cleanup se necessário
    const now = Date.now();
    if (now - statsRef.current.lastCleanup > PERFORMANCE_CONFIG.CACHE_CLEANUP_INTERVAL) {
      let totalCleaned = 0;
      for (const cache of Object.values(caches)) {
        totalCleaned += cache.cleanup();
      }
      
      statsRef.current.lastCleanup = now;
      
      if (__DEV__ && totalCleaned > 0) {
        console.log(`Memory cleanup: ${totalCleaned} items removed`);
      }
    }
  }, []);

  const logRender = useCallback(() => {
    statsRef.current.renders++;
    
    if (__DEV__ && statsRef.current.renders % 50 === 0) {
      checkMemory();
      console.log('Performance stats:', {
        renders: statsRef.current.renders,
        memoryUsage: `${(statsRef.current.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        cacheStats: Object.entries(caches).map(([name, cache]) => ({
          name,
          ...cache.getStats()
        }))
      });
    }
  }, [checkMemory]);

  return { logRender, checkMemory };
}

// Performance hooks específicos para o app
export function useOptimizedScanner() {
  const { logRender } = useMemoryMonitor();
  
  const debouncedScan = useDebounce((code: string) => {
    // Lógica de scan otimizada
    console.log('Scanning:', code);
  }, PERFORMANCE_CONFIG.SEARCH_DEBOUNCE);

  const throttledVibrate = useThrottle(() => {
    // Haptic feedback otimizado
    if (Platform.OS !== 'web') {
      // Implementar haptic feedback
    }
  }, 100);

  return {
    debouncedScan,
    throttledVibrate,
    logRender,
  };
}

export function useOptimizedMetrics(packages: ScannedPackage[]) {
  const cacheKey = `metrics_${packages.length}`;
  
  return usePersistentMemo(() => {
    // Cálculo otimizado de métricas
    const shopee = packages.filter(p => p.type === 'shopee').length;
    const mercadoLivre = packages.filter(p => p.type === 'mercado_livre').length;
    const avulsos = packages.filter(p => p.type === 'avulso').length;
    
    return {
      shopee,
      mercadoLivre,
      avulsos,
      total: packages.length,
    };
  }, [packages], cacheKey, 2 * 60 * 1000); // 2min cache
}

// Performance utilities
export const performanceUtils = {
  // Medir tempo de execução
  measureTime: async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (__DEV__) {
        console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Performance [${label}] ERROR: ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  // Schedule para background
  scheduleBackground: (task: () => void, delay: number = 0) => {
    if (Platform.OS === 'web') {
      setTimeout(() => {
        requestIdleCallback(task);
      }, delay);
    } else {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(task, delay);
      });
    }
  },

  // Preload assets
  preloadAssets: async (assets: string[]) => {
    // Implementar preload de imagens/fontes
    console.log('Preloading assets:', assets);
  },

  // Optimized scroll handler
  createOptimizedScrollHandler: (callback: () => void) => {
    let ticking = false;
    
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
        ticking = true;
      }
    };
  },
};

export default {
  PERFORMANCE_CONFIG,
  useDebounce,
  useThrottle,
  usePersistentMemo,
  useLazyLoad,
  useBatchProcessor,
  useMemoryMonitor,
  useOptimizedScanner,
  useOptimizedMetrics,
  performanceUtils,
};
