import React, { useState, useEffect } from "react";
import { Platform, InteractionManager } from "react-native";
import Animated, {
  cancelAnimation,
  runOnUI,
  Easing,
} from "react-native-reanimated";

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  // FPS target para animações
  TARGET_FPS: 60,

  // Threshold para animações complexas
  COMPLEX_ANIMATION_THRESHOLD: 1000,

  // Debounce time para eventos frequentes
  DEBOUNCE_TIME: 16, // ~60fps

  // Maximum concurrent animations
  MAX_CONCURRENT_ANIMATIONS: 10,

  // Memory cleanup interval
  CLEANUP_INTERVAL: 30000, // 30 seconds
};

// Monitor de performance
class PerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = Date.now();
  private fps = 60;
  private isMonitoring = false;
  private callbacks: ((fps: number) => void)[] = [];

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.measureFPS();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  private measureFPS() {
    if (!this.isMonitoring) return;

    const now = Date.now();
    const delta = now - this.lastFrameTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastFrameTime = now;

      this.callbacks.forEach((callback) => callback(this.fps));
    }

    this.frameCount++;
    requestAnimationFrame(() => this.measureFPS());
  }

  onFPSUpdate(callback: (fps: number) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  getCurrentFPS(): number {
    return this.fps;
  }

  isHighPerformance(): boolean {
    return this.fps >= PERFORMANCE_CONFIG.TARGET_FPS * 0.8; // 80% do target
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Gerenciador de animações
class AnimationManager {
  private activeAnimations = new Set<string>();
  private animationQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  registerAnimation(id: string, animation: () => void) {
    if (
      this.activeAnimations.size >= PERFORMANCE_CONFIG.MAX_CONCURRENT_ANIMATIONS
    ) {
      this.animationQueue.push(animation);
      return false;
    }

    this.activeAnimations.add(id);
    animation();
    return true;
  }

  unregisterAnimation(id: string) {
    this.activeAnimations.delete(id);
    this.processQueue();
  }

  private processQueue() {
    if (this.isProcessingQueue || this.animationQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Process next animation in queue
    const nextAnimation = this.animationQueue.shift();
    if (nextAnimation) {
      setTimeout(() => {
        nextAnimation();
        this.isProcessingQueue = false;
        this.processQueue();
      }, PERFORMANCE_CONFIG.DEBOUNCE_TIME);
    } else {
      this.isProcessingQueue = false;
    }
  }

  getActiveCount(): number {
    return this.activeAnimations.size;
  }

  clearAll() {
    this.activeAnimations.clear();
    this.animationQueue = [];
  }
}

export const animationManager = new AnimationManager();

// Utility para otimizar animações baseado na performance
export function usePerformanceOptimizedAnimation() {
  const shouldUseComplexAnimations = performanceMonitor.isHighPerformance();

  return {
    shouldUseComplexAnimations,
    optimizeAnimation: (animation: () => void) => {
      if (shouldUseComplexAnimations) {
        InteractionManager.runAfterInteractions(() => {
          animation();
        });
      } else {
        // Versão simplificada para dispositivos mais lentos
        setTimeout(animation, 0);
      }
    },
  };
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = PERFORMANCE_CONFIG.DEBOUNCE_TIME,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = PERFORMANCE_CONFIG.DEBOUNCE_TIME,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memory cleanup utility
export function useMemoryCleanup() {
  const cleanup = () => {
    // Limpar animações não utilizadas
    animationManager.clearAll();

    // Forçar garbage collection se disponível
    if (Platform.OS === "web" && "gc" in window) {
      (window as any).gc();
    }
  };

  React.useEffect(() => {
    const interval = setInterval(cleanup, PERFORMANCE_CONFIG.CLEANUP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return cleanup;
}

// Optimized animation presets
export const OPTIMIZED_ANIMATION_PRESETS = {
  // Para dispositivos de alta performance
  high: {
    spring: {
      damping: 15,
      stiffness: 300,
      mass: 1,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
    timing: {
      duration: 250,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },
  },

  // Para dispositivos de média performance
  medium: {
    spring: {
      damping: 20,
      stiffness: 200,
      mass: 1,
      overshootClamping: true,
      restSpeedThreshold: 0.01,
      restDisplacementThreshold: 0.01,
    },
    timing: {
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    },
  },

  // Para dispositivos de baixa performance
  low: {
    spring: {
      damping: 25,
      stiffness: 150,
      mass: 1,
      overshootClamping: true,
      restSpeedThreshold: 0.05,
      restDisplacementThreshold: 0.05,
    },
    timing: {
      duration: 400,
      easing: Easing.linear,
    },
  },
};

// Função para obter preset baseado na performance atual
export function getOptimizedPreset() {
  const fps = performanceMonitor.getCurrentFPS();

  if (fps >= 55) return OPTIMIZED_ANIMATION_PRESETS.high;
  if (fps >= 30) return OPTIMIZED_ANIMATION_PRESETS.medium;
  return OPTIMIZED_ANIMATION_PRESETS.low;
}

// Hook para animações otimizadas
export function useOptimizedAnimation() {
  const preset = getOptimizedPreset();
  const { shouldUseComplexAnimations, optimizeAnimation } =
    usePerformanceOptimizedAnimation();

  return {
    preset,
    shouldUseComplexAnimations,
    optimizeAnimation,
    springConfig: preset.spring,
    timingConfig: preset.timing,
  };
}

// Utility para detectar se deve usar animações
export function shouldAnimate(): boolean {
  // Verificar preferências do usuário
  const prefersReducedMotion =
    Platform.OS === "web" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Verificar performance do dispositivo
  const isLowPerformance = !performanceMonitor.isHighPerformance();

  // Verificar bateria (se disponível)
  const isLowBattery =
    Platform.OS === "web" &&
    (navigator as any).getBattery &&
    (navigator as any).battery?.level < 0.2;

  return !prefersReducedMotion && !isLowPerformance && !isLowBattery;
}

// Hook para gerenciar animações condicionais
export function useConditionalAnimation() {
  const [isAnimationEnabled, setIsAnimationEnabled] =
    useState(shouldAnimate());

  useEffect(() => {
    const unsubscribe = performanceMonitor.onFPSUpdate((fps) => {
      setIsAnimationEnabled(shouldAnimate());
    });

    return unsubscribe;
  }, []);

  return isAnimationEnabled;
}

// Utility para preloading de animações
export function preloadAnimations() {
  // Preload common animation configurations
  if (Platform.OS === "web") {
    // Preload CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    `;
    document.head.appendChild(style);
  }
}

// Utility para batch de atualizações de animação
export function batchAnimationUpdates(updates: Array<() => void>) {
  return new Promise<void>((resolve) => {
    if (Platform.OS === "web") {
      requestAnimationFrame(() => {
        updates.forEach((update) => update());
        resolve();
      });
    } else {
      InteractionManager.runAfterInteractions(() => {
        updates.forEach((update) => update());
        resolve();
      });
    }
  });
}

// Hook para animações de lista otimizadas
export function useOptimizedListAnimation(itemCount: number) {
  const shouldUseStaggered =
    performanceMonitor.isHighPerformance() && itemCount < 50;
  const staggerDelay = shouldUseStaggered ? 50 : 0;

  return {
    shouldUseStaggered,
    staggerDelay,
    shouldAnimate: shouldAnimate(),
  };
}

// Export all utilities
export default {
  performanceMonitor,
  animationManager,
  usePerformanceOptimizedAnimation,
  debounce,
  throttle,
  useMemoryCleanup,
  getOptimizedPreset,
  useOptimizedAnimation,
  shouldAnimate,
  useConditionalAnimation,
  preloadAnimations,
  batchAnimationUpdates,
  useOptimizedListAnimation,
};
