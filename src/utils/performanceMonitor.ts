// src/utils/performanceMonitor.ts
/**
 * Performance Monitor - Real-time Industrial Monitoring
 * Sistema de monitoramento de performance em tempo real para operacional
 */

import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

// Interfaces para monitoramento
interface PerformanceMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  fps: number;
  renderTime: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: number;
}

interface PerformanceAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
}

interface PerformanceHistory {
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  averages: {
    cpu: number;
    memory: number;
    fps: number;
    renderTime: number;
  };
}

// Configurações de monitoramento
const MONITORING_CONFIG = {
  // Intervalos em ms
  SAMPLING_INTERVAL: 1000,     // 1 segundo
  HISTORY_SIZE: 300,           // 5 minutos de histórico
  ALERT_COOLDOWN: 5000,        // 5 segundos entre alerts
  
  // Thresholds para alertas
  THRESHOLDS: {
    CPU_WARNING: 70,           // 70% CPU
    CPU_CRITICAL: 90,          // 90% CPU
    MEMORY_WARNING: 80,        // 80% memória
    MEMORY_CRITICAL: 95,       // 95% memória
    FPS_WARNING: 45,           // 45fps
    FPS_CRITICAL: 30,          // 30fps
    RENDER_TIME_WARNING: 16,   // >16ms (60fps)
    RENDER_TIME_CRITICAL: 33,  // >33ms (30fps)
    NETWORK_LATENCY_WARNING: 500,  // 500ms
    NETWORK_LATENCY_CRITICAL: 1000, // 1s
    CACHE_HIT_RATE_WARNING: 70, // <70% cache hit
    CACHE_HIT_RATE_CRITICAL: 50, // <50% cache hit
    ERROR_RATE_WARNING: 5,     // 5% error rate
    ERROR_RATE_CRITICAL: 10,   // 10% error rate
  },
  
  // Configurações de coleta
  ENABLE_CPU_MONITORING: true,
  ENABLE_MEMORY_MONITORING: true,
  ENABLE_FPS_MONITORING: true,
  ENABLE_NETWORK_MONITORING: true,
  ENABLE_CACHE_MONITORING: true,
  ENABLE_ERROR_MONITORING: true,
};

// Classe principal de monitoramento
class PerformanceMonitor {
  private history: PerformanceHistory = {
    metrics: [],
    alerts: [],
    averages: {
      cpu: 0,
      memory: 0,
      fps: 0,
      renderTime: 0,
    },
  };
  
  private lastAlertTime = useRef<Record<string, number>>({});
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private alertCallbacks: Set<(alert: PerformanceAlert) => void> = new Set();
  
  // FPS monitoring
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fps = 60;
  
  // Render time monitoring
  private renderStartTime = 0;
  private renderTimes: number[] = [];
  
  // Network monitoring
  private networkRequests: Array<{ startTime: number; endTime: number }> = [];
  
  // Cache monitoring
  private cacheHits = 0;
  private cacheMisses = 0;
  
  // Error monitoring
  private totalOperations = 0;
  private errors = 0;
  
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.resetMetrics();
    
    // Iniciar coleta de dados
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, MONITORING_CONFIG.SAMPLING_INTERVAL);
    
    // Iniciar monitoramento de FPS
    this.startFPSMonitoring();
    
    // Iniciar monitoramento de render
    this.startRenderMonitoring();
    
    console.log('Performance monitoring started');
  }
  
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Performance monitoring stopped');
  }
  
  // Registrar callbacks
  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }
  
  // Coleta de métricas
  private collectMetrics(): void {
    const now = Date.now();
    
    const metrics: PerformanceMetrics = {
      cpu: this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      fps: this.fps,
      renderTime: this.getAverageRenderTime(),
      networkLatency: this.getAverageNetworkLatency(),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      timestamp: now,
    };
    
    // Adicionar ao histórico
    this.history.metrics.push(metrics);
    
    // Manter histórico limitado
    if (this.history.metrics.length > MONITORING_CONFIG.HISTORY_SIZE) {
      this.history.metrics.shift();
    }
    
    // Calcular médias
    this.updateAverages();
    
    // Verificar alertas
    this.checkAlerts(metrics);
    
    // Notificar callbacks
    this.callbacks.forEach(callback => callback(metrics));
  }
  
  // Métodos de coleta específicos
  private getCPUUsage(): number {
    if (!MONITORING_CONFIG.ENABLE_CPU_MONITORING) return 0;
    
    // Simulação - em produção usar API real
    if (Platform.OS === 'web') {
      // Web: usar performance API se disponível
      return Math.random() * 100;
    }
    
    // Native: usar APIs específicas da plataforma
    return Math.random() * 100;
  }
  
  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    if (!MONITORING_CONFIG.ENABLE_MEMORY_MONITORING) {
      return { used: 0, total: 0, percentage: 0 };
    }
    
    if (Platform.OS === 'web') {
      // Web: usar performance.memory se disponível
      const memory = (performance as any).memory;
      if (memory) {
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        return {
          used,
          total,
          percentage: (used / total) * 100,
        };
      }
    }
    
    // Native: simulação
    const used = Math.random() * 100 * 1024 * 1024; // MB
    const total = 200 * 1024 * 1024; // 200MB
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }
  
  private getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }
  
  private getAverageNetworkLatency(): number {
    if (this.networkRequests.length === 0) return 0;
    
    const latencies = this.networkRequests.map(req => req.endTime - req.startTime);
    const sum = latencies.reduce((a, b) => a + b, 0);
    return sum / latencies.length;
  }
  
  private getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 100;
  }
  
  private getErrorRate(): number {
    return this.totalOperations > 0 ? (this.errors / this.totalOperations) * 100 : 0;
  }
  
  // Monitoramento de FPS
  private startFPSMonitoring(): void {
    if (!MONITORING_CONFIG.ENABLE_FPS_MONITORING) return;
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      this.frameCount++;
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  // Monitoramento de render
  private startRenderMonitoring(): void {
    // Implementar com React DevTools ou custom hooks
    // Por enquanto, simulação
    setInterval(() => {
      if (this.isMonitoring && this.renderTimes.length < 10) {
        this.renderTimes.push(Math.random() * 20); // 0-20ms
      }
    }, 100);
  }
  
  // Verificação de alertas
  private checkAlerts(metrics: PerformanceMetrics): void {
    const now = Date.now();
    
    // Verificar cada métrica
    this.checkMetricAlert('cpu', metrics.cpu, 
      MONITORING_CONFIG.THRESHOLDS.CPU_WARNING, 
      MONITORING_CONFIG.THRESHOLDS.CPU_CRITICAL, now);
    
    this.checkMetricAlert('memory', metrics.memory.percentage,
      MONITORING_CONFIG.THRESHOLDS.MEMORY_WARNING,
      MONITORING_CONFIG.THRESHOLDS.MEMORY_CRITICAL, now);
    
    this.checkMetricAlert('fps', metrics.fps,
      MONITORING_CONFIG.THRESHOLDS.FPS_WARNING,
      MONITORING_CONFIG.THRESHOLDS.FPS_CRITICAL, now, true); // invertido
    
    this.checkMetricAlert('renderTime', metrics.renderTime,
      MONITORING_CONFIG.THRESHOLDS.RENDER_TIME_WARNING,
      MONITORING_CONFIG.THRESHOLDS.RENDER_TIME_CRITICAL, now);
    
    this.checkMetricAlert('networkLatency', metrics.networkLatency,
      MONITORING_CONFIG.THRESHOLDS.NETWORK_LATENCY_WARNING,
      MONITORING_CONFIG.THRESHOLDS.NETWORK_LATENCY_CRITICAL, now);
    
    this.checkMetricAlert('cacheHitRate', metrics.cacheHitRate,
      MONITORING_CONFIG.THRESHOLDS.CACHE_HIT_RATE_WARNING,
      MONITORING_CONFIG.THRESHOLDS.CACHE_HIT_RATE_CRITICAL, now, true);
    
    this.checkMetricAlert('errorRate', metrics.errorRate,
      MONITORING_CONFIG.THRESHOLDS.ERROR_RATE_WARNING,
      MONITORING_CONFIG.THRESHOLDS.ERROR_RATE_CRITICAL, now);
  }
  
  private checkMetricAlert(
    metric: keyof PerformanceMetrics,
    value: number,
    warningThreshold: number,
    criticalThreshold: number,
    timestamp: number,
    inverted: boolean = false
  ): void {
    const alertKey = `alert_${metric}`;
    const lastAlert = this.lastAlertTime.current[alertKey] || 0;
    
    // Verificar cooldown
    if (timestamp - lastAlert < MONITORING_CONFIG.ALERT_COOLDOWN) return;
    
    let type: 'warning' | 'critical' | null = null;
    let threshold: number = 0;
    
    if (inverted) {
      // Para métricas onde menor é pior (FPS, Cache Hit Rate)
      if (value < criticalThreshold) {
        type = 'critical';
        threshold = criticalThreshold;
      } else if (value < warningThreshold) {
        type = 'warning';
        threshold = warningThreshold;
      }
    } else {
      // Para métricas onde maior é pior (CPU, Memory, etc.)
      if (value > criticalThreshold) {
        type = 'critical';
        threshold = criticalThreshold;
      } else if (value > warningThreshold) {
        type = 'warning';
        threshold = warningThreshold;
      }
    }
    
    if (type) {
      const alert: PerformanceAlert = {
        type,
        message: this.generateAlertMessage(metric, value, threshold, inverted),
        metric,
        value,
        threshold,
        timestamp,
      };
      
      this.history.alerts.push(alert);
      this.lastAlertTime.current[alertKey] = timestamp;
      
      // Notificar callbacks
      this.alertCallbacks.forEach(callback => callback(alert));
    }
  }
  
  private generateAlertMessage(
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number,
    inverted: boolean
  ): string {
    const operator = inverted ? '<' : '>';
    const metricName = this.getMetricDisplayName(metric);
    
    return `${metricName} ${operator} ${threshold.toFixed(1)} (current: ${value.toFixed(1)})`;
  }
  
  private getMetricDisplayName(metric: keyof PerformanceMetrics): string {
    const names: Record<keyof PerformanceMetrics, string> = {
      cpu: 'CPU Usage',
      memory: 'Memory Usage',
      fps: 'FPS',
      renderTime: 'Render Time',
      networkLatency: 'Network Latency',
      cacheHitRate: 'Cache Hit Rate',
      errorRate: 'Error Rate',
      timestamp: 'Timestamp',
    };
    return names[metric] || metric;
  }
  
  private updateAverages(): void {
    if (this.history.metrics.length === 0) return;
    
    const recent = this.history.metrics.slice(-60); // Últimos 60 segundos
    
    this.history.averages = {
      cpu: recent.reduce((sum, m) => sum + m.cpu, 0) / recent.length,
      memory: recent.reduce((sum, m) => sum + m.memory.percentage, 0) / recent.length,
      fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
      renderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length,
    };
  }
  
  private resetMetrics(): void {
    this.history = {
      metrics: [],
      alerts: [],
      averages: {
        cpu: 0,
        memory: 0,
        fps: 0,
        renderTime: 0,
      },
    };
    
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.fps = 60;
    this.renderTimes = [];
    this.networkRequests = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalOperations = 0;
    this.errors = 0;
    this.lastAlertTime.current = {};
  }
  
  // Métodos públicos para registro de eventos
  recordNetworkRequest(startTime: number, endTime: number): void {
    if (MONITORING_CONFIG.ENABLE_NETWORK_MONITORING) {
      this.networkRequests.push({ startTime, endTime });
      
      // Manter apenas últimos 100 requests
      if (this.networkRequests.length > 100) {
        this.networkRequests.shift();
      }
    }
  }
  
  recordCacheHit(): void {
    if (MONITORING_CONFIG.ENABLE_CACHE_MONITORING) {
      this.cacheHits++;
    }
  }
  
  recordCacheMiss(): void {
    if (MONITORING_CONFIG.ENABLE_CACHE_MONITORING) {
      this.cacheMisses++;
    }
  }
  
  recordError(): void {
    if (MONITORING_CONFIG.ENABLE_ERROR_MONITORING) {
      this.errors++;
    }
  }
  
  recordOperation(): void {
    if (MONITORING_CONFIG.ENABLE_ERROR_MONITORING) {
      this.totalOperations++;
    }
  }
  
  recordRenderTime(time: number): void {
    this.renderTimes.push(time);
    
    // Manter apenas últimas 100 medições
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
  }
  
  // Getters
  getHistory(): PerformanceHistory {
    return { ...this.history };
  }
  
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.history.metrics[this.history.metrics.length - 1] || null;
  }
  
  getAverages(): PerformanceHistory['averages'] {
    return { ...this.history.averages };
  }
  
  isRunning(): boolean {
    return this.isMonitoring;
  }
}

// Instância global
const performanceMonitor = new PerformanceMonitor();

// Hook para uso em componentes
export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const alertsRef = useRef<PerformanceAlert[]>([]);
  
  const startMonitoring = useCallback(() => {
    performanceMonitor.start();
  }, []);
  
  const stopMonitoring = useCallback(() => {
    performanceMonitor.stop();
  }, []);
  
  const recordNetworkRequest = useCallback((startTime: number, endTime: number) => {
    performanceMonitor.recordNetworkRequest(startTime, endTime);
  }, []);
  
  const recordCacheHit = useCallback(() => {
    performanceMonitor.recordCacheHit();
  }, []);
  
  const recordCacheMiss = useCallback(() => {
    performanceMonitor.recordCacheMiss();
  }, []);
  
  const recordError = useCallback(() => {
    performanceMonitor.recordError();
  }, []);
  
  const recordOperation = useCallback(() => {
    performanceMonitor.recordOperation();
  }, []);
  
  const recordRenderTime = useCallback((time: number) => {
    performanceMonitor.recordRenderTime(time);
  }, []);
  
  useEffect(() => {
    // Registrar callbacks
    const unsubscribeMetrics = performanceMonitor.onMetricsUpdate((metrics) => {
      metricsRef.current = metrics;
    });
    
    const unsubscribeAlerts = performanceMonitor.onAlert((alert) => {
      alertsRef.current.push(alert);
      
      // Manter apenas últimos 50 alertas
      if (alertsRef.current.length > 50) {
        alertsRef.current.shift();
      }
    });
    
    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, []);
  
  return {
    startMonitoring,
    stopMonitoring,
    recordNetworkRequest,
    recordCacheHit,
    recordCacheMiss,
    recordError,
    recordOperation,
    recordRenderTime,
    getCurrentMetrics: () => metricsRef.current,
    getHistory: () => performanceMonitor.getHistory(),
    getAverages: () => performanceMonitor.getAverages(),
    getAlerts: () => [...alertsRef.current],
    isRunning: () => performanceMonitor.isRunning(),
  };
}

// Exportar instância global e configurações
export { performanceMonitor, MONITORING_CONFIG };
export default performanceMonitor;
