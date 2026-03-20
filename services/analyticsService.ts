/**
 * Serviço de Analytics Profissional
 * Tracking inteligente de eventos e métricas
 */

import { Session, ScannedPackage } from '@/types/session';

interface AnalyticsEvent {
  type: string;
  timestamp: number;
  data: any;
  sessionId?: string;
}

interface PerformanceMetrics {
  sessionDuration: number;
  scanRate: number; // pacotes por minuto
  errorRate: number;
  averageScanTime: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionStart: number = 0;
  private scanCount: number = 0;
  private errorCount: number = 0;

  // Iniciar tracking de sessão
  startSession(sessionId: string): void {
    this.sessionStart = Date.now();
    this.scanCount = 0;
    this.errorCount = 0;
    
    this.trackEvent('session_started', {
      sessionId,
      timestamp: this.sessionStart
    });
  }

  // Track de scan bem-sucedido
  trackScan(packageData: ScannedPackage): void {
    this.scanCount++;
    
    this.trackEvent('package_scanned', {
      packageId: packageData.id,
      packageType: packageData.type,
      packageCode: packageData.code,
      scanTime: Date.now()
    });
  }

  // Track de erro
  trackError(errorType: string, errorData: any): void {
    this.errorCount++;
    
    this.trackEvent('error_occurred', {
      errorType,
      errorData,
      timestamp: Date.now()
    });
  }

  // Track evento genérico
  trackEvent(type: string, data: any): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    this.events.push(event);
    
    // Manter apenas últimos 1000 eventos para não sobrecarregar memória
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  // Calcular métricas de performance
  calculateMetrics(): PerformanceMetrics {
    const sessionDuration = this.sessionStart ? Date.now() - this.sessionStart : 0;
    const sessionDurationMinutes = sessionDuration / (1000 * 60);
    
    return {
      sessionDuration,
      scanRate: sessionDurationMinutes > 0 ? this.scanCount / sessionDurationMinutes : 0,
      errorRate: this.scanCount > 0 ? (this.errorCount / this.scanCount) * 100 : 0,
      averageScanTime: this.scanCount > 0 ? sessionDuration / this.scanCount : 0,
    };
  }

  // Gerar relatório de sessão
  generateSessionReport(session: Session): {
    session: Session;
    metrics: PerformanceMetrics;
    events: AnalyticsEvent[];
    insights: string[];
  } {
    const metrics = this.calculateMetrics();
    const insights = this.generateInsights(metrics, session);
    
    return {
      session,
      metrics,
      events: this.events.filter(e => !e.sessionId || e.sessionId === session.id),
      insights
    };
  }

  // Gerar insights inteligentes
  private generateInsights(metrics: PerformanceMetrics, session: Session): string[] {
    const insights: string[] = [];
    
    // Performance insights
    if (metrics.scanRate > 20) {
      insights.push('🚀 Excelente performance: scanning acima de 20 pacotes/minuto');
    } else if (metrics.scanRate < 5) {
      insights.push('⚠️ Performance baixa: menos de 5 pacotes/minuto');
    }
    
    // Error rate insights
    if (metrics.errorRate > 10) {
      insights.push('❌ Alta taxa de erros: acima de 10%');
    } else if (metrics.errorRate < 2) {
      insights.push('✅ Excelente precisão: menos de 2% de erros');
    }
    
    // Divergence insights
    if (session.hasDivergence) {
      insights.push('⚠️ Sessão com divergência detectada');
    } else {
      insights.push('✅ Sessão concluída sem divergências');
    }
    
    // Duration insights
    if (metrics.sessionDuration > 30 * 60 * 1000) { // 30 minutos
      insights.push('⏰ Sessão longa: mais de 30 minutos');
    }
    
    return insights;
  }

  // Limpar dados
  clear(): void {
    this.events = [];
    this.sessionStart = 0;
    this.scanCount = 0;
    this.errorCount = 0;
  }

  // Exportar eventos para análise
  exportEvents(): AnalyticsEvent[] {
    return [...this.events];
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Exportar tipo para uso em componentes
export type { AnalyticsEvent, PerformanceMetrics };
