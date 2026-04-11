/**
 * Distributed Cache Service - Ultra Performance
 * Sistema de cache distribuído com múltiplos níveis e estratégias avançadas
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  version: string;
}

interface CacheStats {
  totalItems: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionRatio: number;
  averageAccessTime: number;
  oldestItem: number;
  newestItem: number;
}

interface CacheConfig {
  maxMemorySize: number; // em bytes
  maxItems: number;
  defaultTTL: number; // em ms
  compressionThreshold: number; // em bytes
  evictionPolicy: "lru" | "lfu" | "ttl" | "adaptive";
  enableCompression: boolean;
  enableEncryption: boolean;
  enablePersistence: boolean;
  enableDistributed: boolean;
  syncInterval: number; // em ms
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  compressions: number;
  decompressions: number;
  syncs: number;
  errors: number;
  totalAccessTime: number;
  averageAccessTime: number;
}

class DistributedCacheService {
  private static instance: DistributedCacheService;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private diskCache: Map<string, CacheItem<any>> = new Map();
  private distributedCache: Map<string, CacheItem<any>> = new Map();
  private metrics: CacheMetrics;
  private config: CacheConfig;
  private syncTimer: number | null = null;
  private compressionWorker: Worker | null = null;
  private encryptionKey: string = "";
  private isOnline: boolean = true;
  private lastSync: number = Date.now();

  private readonly STORAGE_KEYS = {
    MEMORY_CACHE: "cache_memory",
    DISK_CACHE: "cache_disk",
    METRICS: "cache_metrics",
    CONFIG: "cache_config",
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeService();
  }

  static getInstance(): DistributedCacheService {
    if (!DistributedCacheService.instance) {
      DistributedCacheService.instance = new DistributedCacheService();
    }
    return DistributedCacheService.instance;
  }

  private getDefaultConfig(): CacheConfig {
    return {
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      maxItems: 10000,
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      compressionThreshold: 1024, // 1KB
      evictionPolicy: "adaptive",
      enableCompression: true,
      enableEncryption: false,
      enablePersistence: true,
      enableDistributed: true,
      syncInterval: 60000, // 1 minuto
    };
  }

  private initializeMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      compressions: 0,
      decompressions: 0,
      syncs: 0,
      errors: 0,
      totalAccessTime: 0,
      averageAccessTime: 0,
    };
  }

  private async initializeService(): Promise<void> {
    try {
      // Inicializa criptografia se habilitada
      if (this.config.enableEncryption) {
        await this.initializeEncryption();
      }

      // Carrega dados persistidos
      if (this.config.enablePersistence) {
        await this.loadPersistedData();
      }

      // Inicia worker de compressão se habilitado
      if (this.config.enableCompression) {
        await this.initializeCompressionWorker();
      }

      // Inicia sincronização distribuída
      if (this.config.enableDistributed) {
        this.startDistributedSync();
      }

      // Inicia cleanup automático
      this.startCleanupTimer();

      console.log("[CacheService] Distributed cache initialized successfully");
    } catch (error) {
      console.error("[CacheService] Error initializing cache service:", error);
    }
  }

  /**
   * Set - Armazena item no cache com estratégia multi-nível
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: "low" | "medium" | "high" | "critical";
      tags?: string[];
      persist?: boolean;
      compress?: boolean;
      encrypt?: boolean;
    } = {},
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const ttl = options.ttl || this.config.defaultTTL;
      const priority = options.priority || "medium";
      const tags = options.tags || [];
      const shouldCompress =
        options.compress ??
        (this.config.enableCompression && this.shouldCompress(data));
      const shouldEncrypt = options.encrypt ?? this.config.enableEncryption;
      const shouldPersist = options.persist ?? this.config.enablePersistence;

      // Serializa dados
      let serializedData = JSON.stringify(data);
      let originalSize = serializedData.length;

      // Comprime se necessário
      if (shouldCompress) {
        serializedData = await this.compressData(serializedData);
        this.metrics.compressions++;
      }

      // Criptografa se necessário
      if (shouldEncrypt) {
        serializedData = await this.encryptData(serializedData);
      }

      // Calcula tamanho final
      const finalSize = serializedData.length;

      // Cria item do cache
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: finalSize,
        priority,
        tags,
        version: "1.0",
      };

      // Verifica espaço disponível e evict se necessário
      await this.ensureSpaceAvailable(finalSize);

      // Armazena nos níveis apropriados
      if (priority === "critical" || finalSize < 1024) {
        // Nível 1: Memória
        this.memoryCache.set(key, cacheItem);
      } else if (shouldPersist) {
        // Nível 2: Disco
        this.diskCache.set(key, cacheItem);
        await this.persistToDisk(key, cacheItem);
      }

      // Nível 3: Distribuído (se online)
      if (this.config.enableDistributed && this.isOnline) {
        this.distributedCache.set(key, cacheItem);
        await this.syncToDistributed(key, cacheItem);
      }

      // Atualiza métricas
      this.metrics.sets++;
      this.metrics.totalAccessTime += Date.now() - startTime;
      this.updateAverageAccessTime();

      console.log(
        `[CacheService] SET: ${key} (${finalSize} bytes, priority: ${priority})`,
      );
    } catch (error) {
      this.metrics.errors++;
      console.error(`[CacheService] Error setting cache item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get - Recupera item do cache com busca inteligente
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      // Busca em ordem de prioridade: Memória -> Disco -> Distribuído
      let cacheItem = this.memoryCache.get(key);
      let source = "memory";

      if (!cacheItem) {
        cacheItem = this.diskCache.get(key);
        source = "disk";
      }

      if (!cacheItem && this.config.enableDistributed && this.isOnline) {
        cacheItem = this.distributedCache.get(key);
        source = "distributed";
      }

      if (!cacheItem) {
        this.metrics.misses++;
        this.metrics.totalAccessTime += Date.now() - startTime;
        this.updateAverageAccessTime();
        return null;
      }

      // Verifica TTL
      if (this.isExpired(cacheItem)) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }

      // Atualiza métricas de acesso
      cacheItem.accessCount++;
      cacheItem.lastAccessed = Date.now();

      // Promove para nível superior se acesso frequente
      if (cacheItem.accessCount > 5 && source !== "memory") {
        await this.promoteToMemory(key, cacheItem);
      }

      this.metrics.hits++;
      this.metrics.totalAccessTime += Date.now() - startTime;
      this.updateAverageAccessTime();

      console.log(`[CacheService] HIT: ${key} from ${source}`);

      return cacheItem.data;
    } catch (error) {
      this.metrics.errors++;
      console.error(`[CacheService] Error getting cache item ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete - Remove item de todos os níveis
   */
  async delete(key: string): Promise<void> {
    try {
      // Remove de todos os níveis
      this.memoryCache.delete(key);
      this.diskCache.delete(key);
      this.distributedCache.delete(key);

      // Remove do disco persistido
      await AsyncStorage.removeItem(`cache_${key}`);

      this.metrics.deletes++;
      console.log(`[CacheService] DELETE: ${key}`);
    } catch (error) {
      this.metrics.errors++;
      console.error(`[CacheService] Error deleting cache item ${key}:`, error);
    }
  }

  /**
   * Clear - Limpa cache com filtros
   */
  async clear(
    options: {
      level?: "memory" | "disk" | "distributed" | "all";
      tags?: string[];
      priority?: "low" | "medium" | "high" | "critical";
      olderThan?: number; // timestamp
    } = {},
  ): Promise<void> {
    const level = options.level || "all";
    const tags = options.tags || [];
    const priority = options.priority;
    const olderThan = options.olderThan || 0;

    const shouldDelete = (item: CacheItem<any>, key: string) => {
      if (tags.length > 0 && !tags.some((tag) => item.tags.includes(tag))) {
        return false;
      }
      if (priority && item.priority !== priority) {
        return false;
      }
      if (olderThan > 0 && item.timestamp > olderThan) {
        return false;
      }
      return true;
    };

    try {
      if (level === "memory" || level === "all") {
        for (const [key, item] of this.memoryCache.entries()) {
          if (shouldDelete(item, key)) {
            this.memoryCache.delete(key);
          }
        }
      }

      if (level === "disk" || level === "all") {
        for (const [key, item] of this.diskCache.entries()) {
          if (shouldDelete(item, key)) {
            this.diskCache.delete(key);
            await AsyncStorage.removeItem(`cache_${key}`);
          }
        }
      }

      if (level === "distributed" || level === "all") {
        for (const [key, item] of this.distributedCache.entries()) {
          if (shouldDelete(item, key)) {
            this.distributedCache.delete(key);
          }
        }
      }

      console.log(`[CacheService] CLEAR: ${level} level`);
    } catch (error) {
      this.metrics.errors++;
      console.error("[CacheService] Error clearing cache:", error);
    }
  }

  /**
   * Get multiple - Recuperação em lote otimizada
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      results.set(key, value);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Set multiple - Armazenamento em lote otimizado
   */
  async setMultiple<T>(
    items: Map<string, T>,
    options: {
      ttl?: number;
      priority?: "low" | "medium" | "high" | "critical";
      tags?: string[];
    } = {},
  ): Promise<void> {
    const promises = Array.from(items.entries()).map(async ([key, data]) => {
      await this.set(key, data, options);
    });

    await Promise.all(promises);
  }

  /**
   * Get stats - Estatísticas detalhadas do cache
   */
  getStats(): CacheStats {
    const allItems = [
      ...Array.from(this.memoryCache.values()),
      ...Array.from(this.diskCache.values()),
      ...Array.from(this.distributedCache.values()),
    ];

    const totalItems = allItems.length;
    const memoryUsage = allItems.reduce((sum, item) => sum + item.size, 0);
    const hitRate =
      this.metrics.hits + this.metrics.misses > 0
        ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
        : 0;
    const missRate = 100 - hitRate;

    const timestamps = allItems.map((item) => item.timestamp);
    const oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestItem = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      totalItems,
      memoryUsage,
      hitRate,
      missRate,
      evictionCount: this.metrics.evictions,
      compressionRatio: this.calculateCompressionRatio(),
      averageAccessTime: this.metrics.averageAccessTime,
      oldestItem,
      newestItem,
    };
  }

  /**
   * Get metrics - Métricas de performance
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Warm up - Pré-carrega dados importantes
   */
  async warmUp(keys: string[]): Promise<void> {
    console.log(`[CacheService] Warming up ${keys.length} keys...`);

    const promises = keys.map(async (key) => {
      // Tenta carregar do disco para memória
      const diskItem = this.diskCache.get(key);
      if (diskItem && !this.isExpired(diskItem)) {
        this.memoryCache.set(key, diskItem);
      }
    });

    await Promise.all(promises);
    console.log("[CacheService] Warm up completed");
  }

  /**
   * Export - Exporta dados do cache
   */
  async export(): Promise<any> {
    const allItems = {
      memory: Object.fromEntries(this.memoryCache),
      disk: Object.fromEntries(this.diskCache),
      distributed: Object.fromEntries(this.distributedCache),
    };

    return {
      version: "1.0.0",
      timestamp: Date.now(),
      config: this.config,
      metrics: this.metrics,
      items: allItems,
      stats: this.getStats(),
    };
  }

  /**
   * Import - Importa dados para o cache
   */
  async import(data: any): Promise<void> {
    try {
      if (data.items?.memory) {
        Object.entries(data.items.memory).forEach(([key, item]) => {
          this.memoryCache.set(key, item as CacheItem<any>);
        });
      }

      if (data.items?.disk) {
        Object.entries(data.items.disk).forEach(([key, item]) => {
          this.diskCache.set(key, item as CacheItem<any>);
        });
      }

      if (data.items?.distributed) {
        Object.entries(data.items.distributed).forEach(([key, item]) => {
          this.distributedCache.set(key, item as CacheItem<any>);
        });
      }

      console.log("[CacheService] Import completed successfully");
    } catch (error) {
      console.error("[CacheService] Error importing cache data:", error);
      throw error;
    }
  }

  // Métodos privados
  private shouldCompress(data: any): boolean {
    const serialized = JSON.stringify(data);
    return serialized.length >= this.config.compressionThreshold;
  }

  private async compressData(data: string): Promise<string> {
    // Implementação simplificada de compressão
    // Em produção, usar biblioteca como pako ou lz-string
    return btoa(data); // Base64 como placeholder
  }

  private async decompressData(data: string): Promise<string> {
    // Implementação simplificada de decompressão
    return atob(data); // Base64 como placeholder
  }

  private async encryptData(data: string): Promise<string> {
    // Implementação simplificada de criptografia
    // Em produção, usar biblioteca criptográfica robusta
    return data; // Placeholder
  }

  private async decryptData(data: string): Promise<string> {
    // Implementação simplificada de descriptografia
    return data; // Placeholder
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private async ensureSpaceAvailable(requiredSize: number): Promise<void> {
    const currentUsage = this.getCurrentMemoryUsage();

    if (currentUsage + requiredSize <= this.config.maxMemorySize) {
      return;
    }

    // Evict itens baseado na política
    await this.evictItems(requiredSize);
  }

  private getCurrentMemoryUsage(): number {
    return Array.from(this.memoryCache.values()).reduce(
      (sum, item) => sum + item.size,
      0,
    );
  }

  private async evictItems(requiredSize: number): Promise<void> {
    const items = Array.from(this.memoryCache.entries());
    let freedSpace = 0;

    // Ordena por política de evicção
    switch (this.config.evictionPolicy) {
      case "lru":
        items.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case "lfu":
        items.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case "ttl":
        items.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case "adaptive":
        // Combinação de múltiplos fatores
        items.sort((a, b) => {
          const scoreA = this.calculateEvictionScore(a[1]);
          const scoreB = this.calculateEvictionScore(b[1]);
          return scoreA - scoreB;
        });
        break;
    }

    // Evict itens até liberar espaço suficiente
    for (const [key, item] of items) {
      if (freedSpace >= requiredSize) break;

      this.memoryCache.delete(key);
      freedSpace += item.size;
      this.metrics.evictions++;
    }

    console.log(`[CacheService] Evicted ${freedSpace} bytes`);
  }

  private calculateEvictionScore(item: CacheItem<any>): number {
    const age = Date.now() - item.timestamp;
    const accessFrequency = item.accessCount;
    const timeSinceLastAccess = Date.now() - item.lastAccessed;

    // Score mais baixo = maior prioridade para evicção
    return accessFrequency * 1000 - age / 1000 - timeSinceLastAccess / 1000;
  }

  private async promoteToMemory(
    key: string,
    item: CacheItem<any>,
  ): Promise<void> {
    this.memoryCache.set(key, item);
    this.diskCache.delete(key);
  }

  private async persistToDisk(
    key: string,
    item: CacheItem<any>,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(item);
      await AsyncStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      console.error(`[CacheService] Error persisting to disk: ${key}`, error);
    }
  }

  private async syncToDistributed(
    key: string,
    item: CacheItem<any>,
  ): Promise<void> {
    // Implementar sincronização com servidor distribuído
    // Placeholder para implementação real
  }

  private calculateCompressionRatio(): number {
    const compressedItems = Array.from(this.memoryCache.values()).filter(
      (item) => item.size < 1024,
    ); // Itens pequenos provavelmente comprimidos

    if (compressedItems.length === 0) return 1.0;

    // Placeholder - cálculo real seria baseado no tamanho original vs comprimido
    return 0.7;
  }

  private updateAverageAccessTime(): void {
    const totalOperations = this.metrics.hits + this.metrics.misses;
    if (totalOperations > 0) {
      this.metrics.averageAccessTime =
        this.metrics.totalAccessTime / totalOperations;
    }
  }

  private async initializeEncryption(): Promise<void> {
    // Gerar ou carregar chave de criptografia
    this.encryptionKey = "encryption_key_placeholder";
  }

  private async initializeCompressionWorker(): Promise<void> {
    // Inicializar worker para compressão em background
    // Placeholder para implementação real
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const [memoryData, diskData, metricsData, configData] = await Promise.all(
        [
          AsyncStorage.getItem(this.STORAGE_KEYS.MEMORY_CACHE),
          AsyncStorage.getItem(this.STORAGE_KEYS.DISK_CACHE),
          AsyncStorage.getItem(this.STORAGE_KEYS.METRICS),
          AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG),
        ],
      );

      if (memoryData) {
        const memoryItems = JSON.parse(memoryData);
        Object.entries(memoryItems).forEach(([key, item]) => {
          this.memoryCache.set(key, item as CacheItem<any>);
        });
      }

      if (diskData) {
        const diskItems = JSON.parse(diskData);
        Object.entries(diskItems).forEach(([key, item]) => {
          this.diskCache.set(key, item as CacheItem<any>);
        });
      }

      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }

      if (configData) {
        this.config = JSON.parse(configData);
      }

      console.log("[CacheService] Persisted data loaded");
    } catch (error) {
      console.error("[CacheService] Error loading persisted data:", error);
    }
  }

  private startDistributedSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.isOnline) {
        await this.syncWithDistributed();
      }
    }, this.config.syncInterval);
  }

  private async syncWithDistributed(): Promise<void> {
    try {
      // Implementar sincronização real com cache distribuído
      this.metrics.syncs++;
      this.lastSync = Date.now();
    } catch (error) {
      this.metrics.errors++;
      console.error("[CacheService] Error in distributed sync:", error);
    }
  }

  private startCleanupTimer(): void {
    setInterval(async () => {
      await this.cleanupExpiredItems();
    }, 60000); // 1 minuto
  }

  private async cleanupExpiredItems(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    // Limpa cache de memória
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Limpa cache de disco
    for (const [key, item] of this.diskCache.entries()) {
      if (this.isExpired(item)) {
        this.diskCache.delete(key);
        await AsyncStorage.removeItem(`cache_${key}`);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CacheService] Cleaned up ${cleanedCount} expired items`);
    }
  }

  // Métodos públicos de configuração
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }

    this.memoryCache.clear();
    this.diskCache.clear();
    this.distributedCache.clear();
  }
}

// Exportar instância singleton
export const cacheService = DistributedCacheService.getInstance();
export default DistributedCacheService;
export type { CacheItem, CacheStats, CacheConfig, CacheMetrics };
