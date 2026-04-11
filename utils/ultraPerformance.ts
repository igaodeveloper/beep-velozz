/**
 * Ultra Performance System - Zero Travamentos
 * Sistema extremo para performance máxima sem travamentos
 */

import {
  Platform,
  InteractionManager,
  Dimensions,
  PixelRatio,
} from "react-native";
import { industrialCache } from "./industrialCache";

interface UltraConfig {
  enableZeroLatency: boolean;
  maxMemoryUsage: number; // MB
  frameRateTarget: number;
  aggressiveCleanup: boolean;
}

class UltraPerformanceManager {
  private config: UltraConfig;
  private frameCount = 0;
  private lastFrameTime = 0;
  private isLowEndDevice = false;
  private memoryWarningThreshold = 120; // MB

  constructor(config: Partial<UltraConfig> = {}) {
    this.config = {
      enableZeroLatency: true,
      maxMemoryUsage: 100,
      frameRateTarget: 60,
      aggressiveCleanup: true,
      ...config,
    };

    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
  }

  /**
   * Detecção de capacidades do dispositivo
   */
  private detectDeviceCapabilities(): void {
    // Detectar se é dispositivo de baixo desempenho
    const { width, height } = Dimensions.get("window");
    const pixelRatio = PixelRatio.get();

    // Critérios para dispositivo de baixo desempenho
    this.isLowEndDevice =
      width * height < 1000000 || // < 1MP
      pixelRatio < 2 || // Baixa densidade
      (Platform.OS === "android" && Platform.Version < 24); // Android < 7.0

    if (this.isLowEndDevice) {
      console.warn("Low-end device detected - enabling ultra performance mode");
      this.config.enableZeroLatency = true;
      this.config.aggressiveCleanup = true;
      this.config.maxMemoryUsage = 50;
    }
  }

  /**
   * Monitoramento de performance em tempo real
   */
  private setupPerformanceMonitoring(): void {
    let lastCleanup = Date.now();

    const monitorFrame = () => {
      const now = Date.now();
      const deltaTime = now - this.lastFrameTime;

      if (deltaTime > 0) {
        const fps = 1000 / deltaTime;
        this.frameCount++;

        // Detectar quedas de FPS
        if (fps < 30) {
          this.handleLowFPS();
        }

        // Cleanup agressivo se necessário
        if (now - lastCleanup > 30000) {
          // 30 segundos
          this.performAggressiveCleanup();
          lastCleanup = now;
        }
      }

      this.lastFrameTime = now;
      requestAnimationFrame(monitorFrame);
    };

    requestAnimationFrame(monitorFrame);
  }

  /**
   * Ação para FPS baixo
   */
  private handleLowFPS(): void {
    console.warn("Low FPS detected - applying emergency optimizations");

    // Limpar cache não essencial
    industrialCache.invalidate("temp-");
    industrialCache.invalidate("ui-");

    // Reduzir qualidade
    this.config.frameRateTarget = 30;

    // Notificar sistema para reduzir animações
    if (typeof window !== "undefined") {
      (window as any).__REDUCE_ANIMATIONS__ = true;
    }
  }

  /**
   * Cleanup agressivo de memória
   */
  private performAggressiveCleanup(): void {
    // Limpar cache antigo
    industrialCache.invalidate((key) => {
      const age = Date.now() - parseInt(key.split("-")[1] || "0");
      return age > 60000; // Mais de 1 minuto
    });

    // Forçar garbage collection
    if (Platform.OS === "web" && "gc" in window) {
      (window as any).gc();
    }

    // Limpar event listeners não utilizados
    if (typeof window !== "undefined") {
      (window as any).__CLEANUP_LISTENERS__?.();
    }
  }

  /**
   * Otimização de renderização
   */
  optimizeRendering(): void {
    // Usar InteractionManager para operações pesadas
    InteractionManager.runAfterInteractions(() => {
      // Operações pesadas aqui
    });

    // Reduzir qualidade em dispositivos lentos
    if (this.isLowEndDevice) {
      // Desabilitar sombras e blur
      if (typeof document !== "undefined") {
        document.body.style.setProperty("--disable-shadows", "true");
      }
    }
  }

  /**
   * Otimização de memória
   */
  optimizeMemory(): void {
    // Verificar uso de memória
    const cacheStats = industrialCache.getStats();
    const memoryUsageMB = cacheStats.memoryUsage / (1024 * 1024);

    if (memoryUsageMB > this.memoryWarningThreshold) {
      console.warn(`High memory usage: ${memoryUsageMB}MB`);

      // Limpar cache agressivamente
      industrialCache.invalidate((key) => {
        return !key.includes("critical-") && !key.includes("scanner-");
      });
    }
  }

  /**
   * Pré-carregamento inteligente
   */
  preloadCriticalComponents(): void {
    // Pré-carregar apenas componentes críticos
    const critical = ["scanner-data", "user-session", "app-config"];

    critical.forEach((key) => {
      industrialCache.get(key);
    });
  }

  /**
   * Configuração ultra-rápida
   */
  getUltraFastConfig() {
    return {
      // Sem animações
      animationDuration: 0,
      transitionDuration: 0,

      // Debounce ultra-rápido
      debounceMs: this.isLowEndDevice ? 100 : 50,

      // Cache otimizado
      cacheSize: this.isLowEndDevice ? 25 : 50,
      cacheTTL: this.isLowEndDevice ? 30000 : 60000,

      // Renderização
      enableVirtualization: true,
      enableLazyLoading: true,
      enableOptimizedLists: true,

      // Performance
      enableHardwareAcceleration: true,
      enableGPUAcceleration: true,
      maxConcurrentAnimations: 0, // Sem animações

      // Memória
      maxMemoryUsage: this.config.maxMemoryUsage,
      enableMemoryOptimization: true,
      enableGarbageCollection: true,
    };
  }

  /**
   * Verificar saúde do sistema
   */
  getSystemHealth() {
    const cacheStats = industrialCache.getStats();
    const memoryUsageMB = cacheStats.memoryUsage / (1024 * 1024);
    const currentFPS =
      this.frameCount > 0 ? 1000 / (Date.now() - this.lastFrameTime) : 60;

    return {
      fps: Math.round(currentFPS),
      memoryUsage: Math.round(memoryUsageMB),
      cacheHitRate: cacheStats.hitRate,
      isLowEndDevice: this.isLowEndDevice,
      healthScore: this.calculateHealthScore(
        currentFPS,
        memoryUsageMB,
        cacheStats.hitRate,
      ),
    };
  }

  private calculateHealthScore(
    fps: number,
    memoryMB: number,
    cacheHitRate: number,
  ): number {
    let score = 100;

    // Penalidade por FPS baixo
    if (fps < 30) score -= 40;
    else if (fps < 45) score -= 20;
    else if (fps < 55) score -= 10;

    // Penalidade por uso de memória alto
    if (memoryMB > 150) score -= 30;
    else if (memoryMB > 100) score -= 15;
    else if (memoryMB > 80) score -= 5;

    // Penalidade por cache hit rate baixo
    if (cacheHitRate < 50) score -= 20;
    else if (cacheHitRate < 70) score -= 10;
    else if (cacheHitRate < 85) score -= 5;

    return Math.max(0, score);
  }
}

// Instância global
export const ultraPerformance = new UltraPerformanceManager();

// Hook para uso fácil
export function useUltraPerformance() {
  return {
    config: ultraPerformance.getUltraFastConfig(),
    health: ultraPerformance.getSystemHealth(),
    optimizeRendering: () => ultraPerformance.optimizeRendering(),
    optimizeMemory: () => ultraPerformance.optimizeMemory(),
    preloadCritical: () => ultraPerformance.preloadCriticalComponents(),
  };
}

export default ultraPerformance;
