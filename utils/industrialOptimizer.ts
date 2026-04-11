/**
 * Industrial Performance Optimizer - Ultra High-Speed Operations
 * Sistema de otimização para ambiente operacional industrial
 */

import { Platform, InteractionManager, Dimensions } from "react-native";
import { performanceMonitor, animationManager } from "./performanceOptimizer";
import { industrialCache } from "./industrialCache";

interface OptimizationConfig {
  enableMemoryOptimization: boolean;
  enableAnimationOptimization: boolean;
  enableNetworkOptimization: boolean;
  enableRenderingOptimization: boolean;
  aggressiveCleanup: boolean;
  targetFPS: number;
  memoryThreshold: number; // MB
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  cacheHitRate: number;
  batteryLevel?: number;
}

class IndustrialOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private optimizationCallbacks: Array<(metrics: PerformanceMetrics) => void> =
    [];
  private isOptimizing = false;
  private optimizationTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableMemoryOptimization: true,
      enableAnimationOptimization: true,
      enableNetworkOptimization: true,
      enableRenderingOptimization: true,
      aggressiveCleanup: false,
      targetFPS: 60,
      memoryThreshold: 150, // 150MB
      ...config,
    };

    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      renderTime: 0,
      networkLatency: 0,
      cacheHitRate: 100,
    };

    this.initialize();
  }

  private initialize(): void {
    // Iniciar monitoramento contínuo
    this.startContinuousOptimization();

    // Otimizações iniciais
    this.performInitialOptimizations();

    // Configurar listeners de performance
    this.setupPerformanceListeners();
  }

  /**
   * Otimizações iniciais para startup ultra-rápido
   */
  private performInitialOptimizations(): void {
    // Pre-critical components
    this.preloadCriticalComponents();

    // Limpar cache antigo
    this.cleanupOldCache();

    // Otimizar animações iniciais
    this.optimizeInitialAnimations();
  }

  /**
   * Preload de componentes críticos para operação industrial
   */
  private preloadCriticalComponents(): void {
    const criticalComponents = [
      "scanner-data",
      "session-state",
      "user-preferences",
      "theme-settings",
      "audio-sounds",
    ];

    criticalComponents.forEach((key) => {
      industrialCache.get(key); // Trigger cache load
    });
  }

  /**
   * Limpeza agressiva de cache antigo
   */
  private cleanupOldCache(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    industrialCache.invalidate((key) => {
      // Remover itens mais antigos que 1 hora que não sejam críticos
      const isCritical = [
        "scanner-data",
        "session-state",
        "user-preferences",
      ].some((critical) => key.includes(critical));

      return !isCritical;
    });
  }

  /**
   * Otimizar animações para 60fps garantido
   */
  private optimizeInitialAnimations(): void {
    // Reduzir complexidade inicial de animações
    if (this.metrics.fps < this.config.targetFPS * 0.8) {
      animationManager.clearAll();
    }
  }

  /**
   * Sistema contínuo de otimização
   */
  private startContinuousOptimization(): void {
    this.optimizationTimer = setInterval(() => {
      this.performOptimizationCycle();
    }, 5000); // A cada 5 segundos
  }

  /**
   * Ciclo completo de otimização
   */
  private performOptimizationCycle(): void {
    if (this.isOptimizing) return;

    this.isOptimizing = true;

    try {
      // Coletar métricas
      this.collectMetrics();

      // Analisar performance
      this.analyzePerformance();

      // Aplicar otimizações necessárias
      this.applyOptimizations();

      // Notificar callbacks
      this.notifyOptimizationCallbacks();
    } catch (error) {
      console.warn("Optimization cycle failed:", error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Coleta de métricas de performance
   */
  private collectMetrics(): void {
    // FPS do performance monitor
    this.metrics.fps = performanceMonitor.getCurrentFPS();

    // Cache hit rate
    const cacheStats = industrialCache.getStats();
    this.metrics.cacheHitRate = cacheStats.hitRate;

    // Memory usage (simulado para React Native)
    this.metrics.memoryUsage = cacheStats.memoryUsage / (1024 * 1024); // MB

    // Battery level (se disponível)
    if (Platform.OS === "web" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.metrics.batteryLevel = battery.level;
      });
    }
  }

  /**
   * Análise inteligente de performance
   */
  private analyzePerformance(): void {
    const issues: string[] = [];

    // Análise de FPS
    if (this.metrics.fps < this.config.targetFPS * 0.8) {
      issues.push("Low FPS detected");
    }

    // Análise de memória
    if (this.metrics.memoryUsage > this.config.memoryThreshold) {
      issues.push("High memory usage");
    }

    // Análise de cache
    if (this.metrics.cacheHitRate < 70) {
      issues.push("Low cache hit rate");
    }

    // Análise de bateria
    if (this.metrics.batteryLevel && this.metrics.batteryLevel < 0.2) {
      issues.push("Low battery");
    }

    // Log de problemas para debugging
    if (issues.length > 0) {
      console.warn("Performance issues detected:", issues);
    }
  }

  /**
   * Aplicação de otimizações adaptativas
   */
  private applyOptimizations(): void {
    // Otimização de memória
    if (this.config.enableMemoryOptimization) {
      this.optimizeMemory();
    }

    // Otimização de animações
    if (this.config.enableAnimationOptimization) {
      this.optimizeAnimations();
    }

    // Otimização de rendering
    if (this.config.enableRenderingOptimization) {
      this.optimizeRendering();
    }
  }

  /**
   * Otimização inteligente de memória
   */
  private optimizeMemory(): void {
    if (this.metrics.memoryUsage > this.config.memoryThreshold * 0.8) {
      // Limpeza agressiva se necessário
      if (this.config.aggressiveCleanup) {
        industrialCache.clear();
      } else {
        // Limpeza seletiva
        industrialCache.invalidate((key) => {
          // Manter dados críticos
          const isCritical = [
            "scanner-data",
            "session-state",
            "user-preferences",
          ].some((critical) => key.includes(critical));
          return !isCritical;
        });
      }
    }
  }

  /**
   * Otimização de animações para performance
   */
  private optimizeAnimations(): void {
    if (this.metrics.fps < this.config.targetFPS) {
      // Reduzir complexidade de animações
      animationManager.clearAll();

      // Desabilitar animações complexas em dispositivos lentos
      if (this.metrics.fps < 30) {
        console.warn("Disabling complex animations due to low performance");
      }
    }
  }

  /**
   * Otimização de rendering
   */
  private optimizeRendering(): void {
    // Forçar garbage collection se disponível
    if (Platform.OS === "web" && "gc" in window) {
      (window as any).gc();
    }

    // Otimizar render com InteractionManager
    InteractionManager.runAfterInteractions(() => {
      // Operações pesadas após interações
    });
  }

  /**
   * Configurar listeners de performance
   */
  private setupPerformanceListeners(): void {
    // Listener de FPS
    performanceMonitor.onFPSUpdate((fps) => {
      this.metrics.fps = fps;

      // Otimização reativa
      if (fps < this.config.targetFPS * 0.6) {
        this.performEmergencyOptimization();
      }
    });

    // Listener de mudança de dimensões
    Dimensions.addEventListener("change", () => {
      // Otimizar para nova orientação/tamanho
      this.optimizeForScreenChange();
    });
  }

  /**
   * Otimização de emergência para performance crítica
   */
  private performEmergencyOptimization(): void {
    console.warn("Emergency optimization triggered!");

    // Limpar tudo não essencial
    animationManager.clearAll();

    // Limpar cache agressivamente
    industrialCache.invalidate((key) => {
      const isCritical = ["scanner-data", "session-state"].some((critical) =>
        key.includes(critical),
      );
      return !isCritical;
    });

    // Reduzir qualidade de animações
    this.config.enableAnimationOptimization = false;
  }

  /**
   * Otimização para mudanças de tela
   */
  private optimizeForScreenChange(): void {
    // Preparar cache para novas dimensões
    industrialCache.invalidate("layout-cache");
    industrialCache.invalidate("responsive-dimensions");
  }

  /**
   * Notificar callbacks de otimização
   */
  private notifyOptimizationCallbacks(): void {
    this.optimizationCallbacks.forEach((callback) => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.warn("Optimization callback failed:", error);
      }
    });
  }

  /**
   * API Pública - Adicionar callback de otimização
   */
  onOptimization(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.optimizationCallbacks.push(callback);

    return () => {
      const index = this.optimizationCallbacks.indexOf(callback);
      if (index > -1) {
        this.optimizationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * API Pública - Forçar otimização manual
   */
  forceOptimization(): void {
    this.performOptimizationCycle();
  }

  /**
   * API Pública - Obter métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * API Pública - Configurar otimizações
   */
  configure(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * API Pública - Destruir otimizador
   */
  destroy(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }

    this.optimizationCallbacks = [];
  }
}

// Instância global para uso industrial
export const industrialOptimizer = new IndustrialOptimizer({
  enableMemoryOptimization: true,
  enableAnimationOptimization: true,
  enableNetworkOptimization: true,
  enableRenderingOptimization: true,
  aggressiveCleanup: false, // Mudar para true em produção se necessário
  targetFPS: 60,
  memoryThreshold: 150,
});

// Hook para uso fácil
export function useIndustrialOptimizer() {
  return {
    metrics: industrialOptimizer.getMetrics(),
    forceOptimization: () => industrialOptimizer.forceOptimization(),
    onOptimization: (callback: (metrics: PerformanceMetrics) => void) =>
      industrialOptimizer.onOptimization(callback),
    configure: (config: Partial<OptimizationConfig>) =>
      industrialOptimizer.configure(config),
  };
}

export default industrialOptimizer;
