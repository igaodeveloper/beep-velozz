import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}

// Global cache instance
const globalCache = new IntelligentCache();

// React hook for cache management
export function useIntelligentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = globalCache.get<T>(key);
      if (cachedData !== null) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await fetcher();
      
      // Cache the result
      globalCache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [key, fetcher, ttl]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    fetchData,
    cleanup,
  };
}

// Utility functions for direct cache access
export const cache = {
  get: <T>(key: string) => globalCache.get<T>(key),
  set: <T>(key: string, data: T, ttl?: number) => globalCache.set(key, data, ttl),
  has: (key: string) => globalCache.has(key),
  delete: (key: string) => globalCache.delete(key),
  clear: () => globalCache.clear(),
  cleanup: () => globalCache.cleanup(),
  getStats: () => globalCache.getStats(),
};

// Auto cleanup expired entries every 5 minutes
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000);

export default IntelligentCache;
