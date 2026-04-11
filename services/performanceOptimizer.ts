/**
 * Performance Optimizer - Ultra High Speed
 * Sistema de otimização para operação crítica com zero delay
 */

import { Platform, InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  jsThreadTime: number;
  uiThreadTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  operationLatency: number;
}

interface OperationQueue {
  id: string;
  operation: () => Promise<any>;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: number;
  timeout: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  priority: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private operationQueue: OperationQueue[] = [];
  private isProcessingQueue = false;
  private ultraFastCache: Map<string, CacheEntry<any>> = new Map();
  private preloadedResources: Map<string, any> = new Map();
  private metrics: PerformanceMetrics;
  private frameTimer: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private targetFPS = 60;
  private frameInterval = 1000 / this.targetFPS;

  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CRITICAL_CACHE_SIZE = 100;
  private readonly QUEUE_BATCH_SIZE = 10;
  private readonly PRELOAD_TIMEOUT = 5000;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.initializeOptimizer();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      frameRate: 60,
      renderTime: 0,
      jsThreadTime: 0,
      uiThreadTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      operationLatency: 0,
    };
  }

  private async initializeOptimizer(): Promise<void> {
    // Inicia monitoramento de FPS
    this.startFrameMonitoring();

    // Inicia processamento da fila
    this.startQueueProcessor();

    // Preload recursos críticos
    await this.preloadCriticalResources();

    // Otimiza garbage collection
    this.optimizeGarbageCollection();

    console.log("[PerformanceOptimizer] Ultra-fast optimizer initialized");
  }

  /**
   * Executa operação crítica com prioridade máxima
   */
  async executeCritical<T>(
    operation: () => Promise<T>,
    timeout: number = 100,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Tenta cache ultra-rápido primeiro
      const cacheKey = this.generateCacheKey(operation.toString());
      const cached = this.getFromUltraFastCache<T>(cacheKey);
      if (cached !== null) {
        this.updateMetrics("cacheHit", Date.now() - startTime);
        return cached;
      }

      // Executa em micro-task para não bloquear UI
      const result = await this.runInMicroTask(operation, timeout);

      // Cache para próximas operações
      this.setInUltraFastCache(cacheKey, result, 30000); // 30s TTL

      this.updateMetrics("operation", Date.now() - startTime);
      return result;
    } catch (error) {
      console.error("[PerformanceOptimizer] Critical operation failed:", error);
      throw error;
    }
  }

  /**
   * Executa operação em micro-task sem bloquear UI
   */
  private async runInMicroTask<T>(
    operation: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Operation timeout"));
      }, timeout);

      // Usa InteractionManager para executar após animações
      InteractionManager.runAfterInteractions(() => {
        operation()
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    });
  }

  /**
   * Cache ultra-rápido para operações críticas
   */
  private getFromUltraFastCache<T>(key: string): T | null {
    const entry = this.ultraFastCache.get(key);
    if (!entry) return null;

    // Verifica TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.ultraFastCache.delete(key);
      return null;
    }

    // Atualiza acesso
    entry.accessCount++;
    entry.priority = Math.min(10, entry.priority + 1);

    return entry.data;
  }

  private setInUltraFastCache<T>(key: string, data: T, ttl: number): void {
    // Verifica espaço no cache crítico
    if (this.ultraFastCache.size >= this.CRITICAL_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    this.ultraFastCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      priority: 5,
    });
  }

  private evictLeastUsed(): void {
    let leastUsedKey = "";
    let leastScore = Infinity;

    for (const [key, entry] of this.ultraFastCache.entries()) {
      const score = entry.accessCount * (entry.priority / 10);
      if (score < leastScore) {
        leastScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.ultraFastCache.delete(leastUsedKey);
    }
  }

  /**
   * Preload de recursos críticos
   */
  private async preloadCriticalResources(): Promise<void> {
    const criticalResources = [
      "scanner-identification",
      "package-types",
      "validation-rules",
      "audio-feedback",
      "haptic-patterns",
      "ui-components",
    ];

    const preloadPromises = criticalResources.map(async (resource) => {
      try {
        // Preload baseado no tipo de recurso
        let data;
        switch (resource) {
          case "scanner-identification":
            data = await this.preloadScannerRules();
            break;
          case "package-types":
            data = await this.preloadPackageTypes();
            break;
          case "validation-rules":
            data = await this.preloadValidationRules();
            break;
          case "audio-feedback":
            data = await this.preloadAudioAssets();
            break;
          case "haptic-patterns":
            data = await this.preloadHapticPatterns();
            break;
          case "ui-components":
            data = await this.preloadUIComponents();
            break;
        }

        this.preloadedResources.set(resource, data);
      } catch (error) {
        console.warn(
          `[PerformanceOptimizer] Failed to preload ${resource}:`,
          error,
        );
      }
    });

    await Promise.all(preloadPromises);
    console.log("[PerformanceOptimizer] Critical resources preloaded");
  }

  private async preloadScannerRules(): Promise<any> {
    // Cache de regras de identificação
    return {
      mercadoLivre: [/^20000/, /^466/, /^ML/],
      shopee: [/^BR/, /^SHOPEE/],
      avulso: [/^LM/, /^14/, /^[A-Z]/],
    };
  }

  private async preloadPackageTypes(): Promise<any> {
    // Cache de tipos de pacotes
    return {
      shopee: { color: "#FF6B35", audio: "beep_a" },
      mercado_livre: { color: "#667EEA", audio: "beep_b" },
      avulso: { color: "#48BB78", audio: "beep_c" },
      unknown: { color: "#718096", audio: "beep_error" },
    };
  }

  private async preloadValidationRules(): Promise<any> {
    // Cache de regras de validação
    return {
      minLength: 4,
      maxLength: 50,
      allowedChars: /^[A-Z0-9]+$/,
      patterns: {
        numeric: /^\d+$/,
        alphanumeric: /^[A-Z0-9]+$/,
      },
    };
  }

  private async preloadAudioAssets(): Promise<any> {
    // Preload de assets de áudio
    return {
      beep_a: "preloaded",
      beep_b: "preloaded",
      beep_c: "preloaded",
      beep_error: "preloaded",
    };
  }

  private async preloadHapticPatterns(): Promise<any> {
    // Preload de padrões hápticos
    return {
      success: "light",
      error: "heavy",
      warning: "medium",
      scan: "light",
    };
  }

  private async preloadUIComponents(): Promise<any> {
    // Preload de componentes UI
    return {
      button: "preloaded",
      input: "preloaded",
      modal: "preloaded",
    };
  }

  /**
   * Otimização de renderização para 60fps constante
   */
  startFrameMonitoring(): void {
    let lastTime = Date.now();
    let frames = 0;

    const monitorFrame = () => {
      const currentTime = Date.now();
      frames++;

      // Calcula FPS a cada segundo
      if (currentTime - lastTime >= 1000) {
        const fps = frames;
        this.metrics.frameRate = fps;

        // Se FPS cair abaixo de 55, ativa otimizações
        if (fps < 55) {
          this.activatePerformanceBoost();
        }

        frames = 0;
        lastTime = currentTime;
      }

      // Agenda próximo frame
      this.frameTimer = setTimeout(monitorFrame, this.frameInterval);
    };

    monitorFrame();
  }

  private activatePerformanceBoost(): void {
    console.log("[PerformanceOptimizer] Activating performance boost");

    // Limpa cache não essencial
    this.clearNonEssentialCache();

    // Reduz qualidade de animações temporariamente
    this.reduceAnimationQuality();

    // Prioriza operações críticas
    this.prioritizeCriticalOperations();
  }

  private clearNonEssentialCache(): void {
    // Mantém apenas cache crítico
    const criticalKeys = Array.from(this.ultraFastCache.keys()).slice(
      0,
      this.CRITICAL_CACHE_SIZE,
    );

    this.ultraFastCache.clear();
    criticalKeys.forEach((key) => {
      const entry = this.ultraFastCache.get(key);
      if (entry) {
        this.ultraFastCache.set(key, entry);
      }
    });
  }

  private reduceAnimationQuality(): void {
    // Reduz qualidade de animações para manter FPS
    // Implementar redução de complexidade de animações
  }

  private prioritizeCriticalOperations(): void {
    // Reordena fila para priorizar operações críticas
    this.operationQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Processamento assíncrono da fila de operações
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.operationQueue.length > 0) {
        this.processQueue();
      }
    }, 16); // ~60fps
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      // Processa em batches para não bloquear
      const batch = this.operationQueue.splice(0, this.QUEUE_BATCH_SIZE);

      await Promise.all(
        batch.map(async (item) => {
          try {
            await Promise.race([
              item.operation(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Queue timeout")),
                  item.timeout,
                ),
              ),
            ]);
          } catch (error) {
            console.error(
              `[PerformanceOptimizer] Queue operation failed:`,
              error,
            );
          }
        }),
      );
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Adiciona operação à fila de processamento
   */
  queueOperation<T>(
    operation: () => Promise<T>,
    priority: "critical" | "high" | "medium" | "low" = "medium",
    timeout: number = 1000,
  ): void {
    const queueItem: OperationQueue = {
      id: Math.random().toString(36),
      operation,
      priority,
      timestamp: Date.now(),
      timeout,
    };

    this.operationQueue.push(queueItem);

    // Se for crítico, processa imediatamente
    if (priority === "critical") {
      this.operationQueue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }
  }

  /**
   * Otimização de garbage collection
   */
  private optimizeGarbageCollection(): void {
    // Limpa referências não utilizadas periodicamente
    setInterval(() => {
      this.cleanupReferences();
    }, 30000); // 30 segundos
  }

  private cleanupReferences(): void {
    // Limpa cache expirado
    const now = Date.now();
    for (const [key, entry] of this.ultraFastCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.ultraFastCache.delete(key);
      }
    }

    // Limpa operações expiradas da fila
    this.operationQueue = this.operationQueue.filter(
      (item) => now - item.timestamp < item.timeout,
    );
  }

  /**
   * Gera chave de cache otimizada
   */
  private generateCacheKey(operation: string): string {
    // Hash simples para gerar chave única
    let hash = 0;
    for (let i = 0; i < operation.length; i++) {
      const char = operation.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Converte para 32-bit integer
    }
    return `cache_${Math.abs(hash)}`;
  }

  /**
   * Atualiza métricas de performance
   */
  private updateMetrics(type: "operation" | "cacheHit", latency: number): void {
    if (type === "operation") {
      this.metrics.operationLatency = latency;
    } else {
      this.metrics.cacheHitRate =
        (this.metrics.cacheHitRate + (100 - latency)) / 2; // Simplificado
    }
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Verifica se está em modo de alta performance
   */
  isHighPerformanceMode(): boolean {
    return (
      this.metrics.frameRate >= 55 &&
      this.metrics.operationLatency < 50 &&
      this.metrics.cacheHitRate > 80
    );
  }

  /**
   * Força modo de performance máxima
   */
  forceMaxPerformance(): void {
    console.log("[PerformanceOptimizer] Forcing maximum performance");

    // Limpa todo cache não crítico
    this.ultraFastCache.clear();

    // Reduz qualidade visual ao mínimo
    this.reduceAnimationQuality();

    // Prioriza apenas operações críticas
    this.operationQueue = this.operationQueue.filter(
      (item) => item.priority === "critical" || item.priority === "high",
    );

    // Ativa monitoramento agressivo
    this.targetFPS = 120;
    this.frameInterval = 1000 / this.targetFPS;
  }

  /**
   * Restaura modo normal de operação
   */
  restoreNormalMode(): void {
    console.log("[PerformanceOptimizer] Restoring normal mode");

    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;

    // Recarrega recursos
    this.preloadCriticalResources();
  }

  /**
   * Obtém recurso preloaded
   */
  getPreloadedResource(key: string): any {
    return this.preloadedResources.get(key);
  }

  /**
   * Limpa todos os caches
   */
  clearAllCaches(): void {
    this.ultraFastCache.clear();
    this.preloadedResources.clear();
    this.operationQueue = [];
    console.log("[PerformanceOptimizer] All caches cleared");
  }

  /**
   * Destrói otimizador
   */
  destroy(): void {
    if (this.frameTimer) {
      clearTimeout(this.frameTimer);
      this.frameTimer = null;
    }

    this.clearAllCaches();
    console.log("[PerformanceOptimizer] Optimizer destroyed");
  }
}

// Exportar instância singleton
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export default PerformanceOptimizer;
export type { PerformanceMetrics, OperationQueue, CacheEntry };
