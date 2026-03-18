/**
 * Industrial Cache System - Ultra Performance for High-Speed Operations
 * Cache inteligente com estratégias adaptativas para ambiente operacional
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  memoryUsage: number;
}

interface CacheConfig {
  maxSize: number; // MB
  maxItems: number;
  defaultTTL: number; // ms
  cleanupInterval: number; // ms
  compressionThreshold: number; // bytes
}

class IndustrialCache {
  private cache = new Map<string, CacheItem>();
  private stats: CacheStats = {
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    memoryUsage: 0,
  };
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50, // 50MB
      maxItems: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      cleanupInterval: 60 * 1000, // 1 minuto
      compressionThreshold: 1024, // 1KB
      ...config,
    };

    this.startCleanup();
    this.loadFromDisk();
  }

  /**
   * Cache ultra-rápido com memória e persistência
   */
  async set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): Promise<void> {
    const now = Date.now();
    const serialized = JSON.stringify(data);
    const size = this.calculateSize(serialized);

    // Verificar limite de tamanho
    if (size > this.config.maxSize * 1024 * 1024) {
      console.warn(`Cache item too large: ${key} (${size} bytes)`);
      return;
    }

    // Remover itens antigos se necessário
    await this.ensureCapacity(size);

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl,
      hits: 0,
      size,
    };

    this.cache.set(key, item);
    this.updateStats();

    // Persistir itens importantes
    if (size > this.config.compressionThreshold) {
      await this.persistToDisk(key, item);
    }
  }

  /**
   * Get ultra-rápido com otimização de hardware
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      // Tentar carregar do disco
      const diskItem = await this.loadFromDiskItem(key);
      if (diskItem) {
        this.cache.set(key, diskItem);
        this.hitCount++;
        return diskItem.data as T;
      }
      
      this.missCount++;
      return null;
    }

    // Verificar TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    item.hits++;
    this.hitCount++;
    return item.data as T;
  }

  /**
   * Batch operations para alta performance
   */
  async getBatch<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // Processar em paralelo para máxima performance
    await Promise.all(
      keys.map(async (key) => {
        const result = await this.get<T>(key);
        results.set(key, result);
      })
    );

    return results;
  }

  /**
   * Prefetch inteligente para operações futuras
   */
  async prefetch<T>(keys: string[], loader: (key: string) => Promise<T>): Promise<void> {
    const missingKeys = keys.filter(key => !this.cache.has(key));
    
    if (missingKeys.length === 0) return;

    // Carregar em batch com limite de concorrência
    const batchSize = 5;
    for (let i = 0; i < missingKeys.length; i += batchSize) {
      const batch = missingKeys.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (key) => {
          try {
            const data = await loader(key);
            await this.set(key, data);
          } catch (error) {
            console.warn(`Failed to prefetch ${key}:`, error);
          }
        })
      );
    }
  }

  /**
   * Cache com invalidação inteligente
   */
  async invalidate(pattern: string | RegExp | ((key: string) => boolean)): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      let shouldDelete = false;

      if (typeof pattern === 'string') {
        shouldDelete = key.includes(pattern);
      } else if (pattern instanceof RegExp) {
        shouldDelete = pattern.test(key);
      } else if (typeof pattern === 'function') {
        shouldDelete = pattern(key);
      }

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`);
    });

    this.updateStats();
  }

  /**
   * Limpeza inteligente baseada em uso
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    if (this.stats.totalSize + requiredSize <= this.config.maxSize * 1024 * 1024 &&
        this.stats.totalItems < this.config.maxItems) {
      return;
    }

    // Ordenar por LRU (Least Recently Used)
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        // Priorizar itens com mais hits
        if (a.hits !== b.hits) return b.hits - a.hits;
        // Depois por timestamp (mais antigos primeiro)
        return a.timestamp - b.timestamp;
      });

    let freedSize = 0;
    let freedItems = 0;

    for (const [key, item] of items) {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`);
      
      freedSize += item.size;
      freedItems++;

      if (freedSize >= requiredSize || 
          this.stats.totalItems - freedItems < this.config.maxItems) {
        break;
      }
    }
  }

  /**
   * Persistência otimizada para disco
   */
  private async persistToDisk(key: string, item: CacheItem): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn(`Failed to persist cache item ${key}:`, error);
    }
  }

  private async loadFromDiskItem(key: string): Promise<CacheItem | null> {
    try {
      const data = await AsyncStorage.getItem(`cache_${key}`);
      if (data) {
        const item = JSON.parse(data) as CacheItem;
        
        // Verificar TTL
        if (Date.now() - item.timestamp > item.ttl) {
          AsyncStorage.removeItem(`cache_${key}`);
          return null;
        }
        
        return item;
      }
    } catch (error) {
      console.warn(`Failed to load cache item ${key}:`, error);
    }
    
    return null;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length === 0) return;

      const items = await AsyncStorage.multiGet(cacheKeys);
      
      items.forEach(([fullKey, data]) => {
        if (data) {
          try {
            const key = fullKey.replace('cache_', '');
            const item = JSON.parse(data) as CacheItem;
            
            // Verificar TTL
            if (Date.now() - item.timestamp <= item.ttl) {
              this.cache.set(key, item);
            } else {
              AsyncStorage.removeItem(fullKey);
            }
          } catch (error) {
            // Ignorar itens corrompidos
          }
        }
      });

      this.updateStats();
    } catch (error) {
      console.warn('Failed to load cache from disk:', error);
    }
  }

  /**
   * Limpeza automática otimizada
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`);
    });

    if (keysToDelete.length > 0) {
      this.updateStats();
    }
  }

  private calculateSize(data: string): number {
    return new Blob([data]).size;
  }

  private updateStats(): void {
    this.stats.totalItems = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
    this.stats.hitRate = this.hitCount + this.missCount > 0 
      ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
      : 0;
    this.stats.memoryUsage = this.stats.totalSize;
  }

  /**
   * Estatísticas detalhadas para monitoramento
   */
  getStats(): CacheStats & { hitCount: number; missCount: number } {
    return {
      ...this.stats,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }

  /**
   * Limpeza completa para memória
   */
  async clear(): Promise<void> {
    this.cache.clear();
    
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);

    this.hitCount = 0;
    this.missCount = 0;
    this.updateStats();
  }

  /**
   * Destruição segura
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Instância global para uso industrial
export const industrialCache = new IndustrialCache({
  maxSize: 100, // 100MB para ambiente industrial
  maxItems: 2000,
  defaultTTL: 10 * 60 * 1000, // 10 minutos
  cleanupInterval: 30 * 1000, // 30 segundos
});

// Hooks para uso fácil
export function useIndustrialCache() {
  return {
    get: <T>(key: string) => industrialCache.get<T>(key),
    set: <T>(key: string, data: T, ttl?: number) => industrialCache.set(key, data, ttl),
    getBatch: <T>(keys: string[]) => industrialCache.getBatch<T>(keys),
    prefetch: <T>(keys: string[], loader: (key: string) => Promise<T>) => 
      industrialCache.prefetch(keys, loader),
    invalidate: (pattern: string | RegExp | ((key: string) => boolean)) => 
      industrialCache.invalidate(pattern),
    getStats: () => industrialCache.getStats(),
    clear: () => industrialCache.clear(),
  };
}

export default industrialCache;
