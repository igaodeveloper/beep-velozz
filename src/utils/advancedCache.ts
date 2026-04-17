// src/utils/advancedCache.ts
/**
 * Advanced Cache System - Redis-like Performance
 * Cache LRU com TTL, compressão e memória otimizada
 */

import { Session, ScannedPackage } from '@/types/session';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
  evictions: number;
}

class AdvancedCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder = new Set<string>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    maxSize: 0,
    hitRate: 0,
    evictions: 0,
  };

  constructor(
    private maxSize: number = 1000,
    private maxMemory: number = 50 * 1024 * 1024, // 50MB
    private defaultTTL: number = 5 * 60 * 1000 // 5 minutos
  ) {}

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const itemTTL = ttl || this.defaultTTL;
    const size = this.calculateSize(value);

    // Verificar se precisa de espaço
    if (this.cache.size >= this.maxSize || this.getCurrentMemorySize() + size > this.maxMemory) {
      this.evictLeastUsed();
    }

    const item: CacheItem<T> = {
      value,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 1,
      lastAccessed: now,
      size,
    };

    this.cache.set(key, item);
    this.accessOrder.add(key);
    this.updateStats();
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    const now = Date.now();

    if (!item) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Verificar TTL
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Atualizar acesso
    item.accessCount++;
    item.lastAccessed = now;
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    this.stats.hits++;
    this.updateStats();
    return item.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize: this.maxSize,
      hitRate: 0,
      evictions: 0,
    };
  }

  private evictLeastUsed(): void {
    if (this.accessOrder.size === 0) return;

    // Encontrar item menos usado
    let leastUsedKey: string | null = null;
    let leastScore = Infinity;

    for (const key of this.accessOrder) {
      const item = this.cache.get(key);
      if (!item) continue;

      // Score baseado em frequência e tempo
      const now = Date.now();
      const age = now - item.lastAccessed;
      const frequency = item.accessCount;
      const score = frequency / (age + 1);

      if (score < leastScore) {
        leastScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  private calculateSize(value: T): number {
    try {
      // Estimar tamanho em bytes
      const serialized = JSON.stringify(value);
      return serialized.length * 2; // UTF-16
    } catch {
      return 1024; // Default 1KB
    }
  }

  private getCurrentMemorySize(): number {
    let total = 0;
    for (const item of this.cache.values()) {
      total += item.size;
    }
    return total;
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.maxSize = this.maxSize;
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Limpar itens expirados
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Preload múltiplos itens
  setBatch(items: Array<{ key: string; value: T; ttl?: number }>): void {
    for (const { key, value, ttl } of items) {
      this.set(key, value, ttl);
    }
  }

  // Get múltiplos itens
  getBatch(keys: string[]): Array<{ key: string; value: T | null }> {
    return keys.map(key => ({
      key,
      value: this.get(key)
    }));
  }
}

// Cache global para performance
const globalCache = new AdvancedCache(2000, 100 * 1024 * 1024); // 100MB

// Cache específico para diferentes tipos de dados
export const caches = {
  session: new AdvancedCache<Session>(100, 10 * 1024 * 1024, 10 * 60 * 1000), // 10min
  packages: new AdvancedCache<ScannedPackage[]>(50, 20 * 1024 * 1024, 5 * 60 * 1000), // 5min
  metrics: new AdvancedCache<any>(200, 5 * 1024 * 1024, 2 * 60 * 1000), // 2min
  ui: new AdvancedCache<any>(500, 10 * 1024 * 1024, 30 * 1000), // 30s
  global: globalCache,
};

// Auto cleanup a cada 2 minutos
setInterval(() => {
  let totalCleaned = 0;
  for (const cache of Object.values(caches)) {
    totalCleaned += cache.cleanup();
  }
  
  if (__DEV__ && totalCleaned > 0) {
    console.log(`Cache cleanup: ${totalCleaned} items removed`);
  }
}, 2 * 60 * 1000);

export default AdvancedCache;
