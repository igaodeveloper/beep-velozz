import { captureMessage } from '../utils/sentry';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface UserProperties {
  userId?: string;
  deviceId: string;
  platform: string;
  appVersion: string;
  language: string;
}

export class AnalyticsService {
  private userProperties: UserProperties | null = null;
  private eventsQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  async initialize(userProperties: UserProperties) {
    this.userProperties = userProperties;
    this.isInitialized = true;

    // Send queued events
    while (this.eventsQueue.length > 0) {
      const event = this.eventsQueue.shift();
      if (event) {
        await this.sendEvent(event);
      }
    }

    captureMessage('Analytics initialized', 'info', { userProperties });
  }

  async trackEvent(event: AnalyticsEvent) {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    if (!this.isInitialized) {
      this.eventsQueue.push(eventWithTimestamp);
      return;
    }

    await this.sendEvent(eventWithTimestamp);
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // In development, just log to console
      if (__DEV__) {
        console.log('📊 Analytics Event:', {
          ...event,
          userProperties: this.userProperties,
        });
        return;
      }

      // In production, send to analytics service
      // This could be Firebase Analytics, Mixpanel, etc.
      const payload = {
        event: event.name,
        properties: {
          ...event.properties,
          ...this.userProperties,
          timestamp: event.timestamp,
        },
      };

      // Send to your analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      captureMessage(`Analytics event: ${event.name}`, 'info', event.properties);
    } catch (error) {
      captureMessage('Analytics error', 'error', { error, event });
    }
  }

  // Predefined tracking methods
  async trackScreenView(screenName: string, properties?: Record<string, any>) {
    await this.trackEvent({
      name: 'screen_view',
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  async trackScanEvent(scanType: string, success: boolean, duration: number) {
    await this.trackEvent({
      name: 'scan_completed',
      properties: {
        scan_type: scanType,
        success,
        duration_ms: duration,
      },
    });
  }

  async trackSessionEvent(action: 'start' | 'end' | 'pause' | 'resume', sessionId: string) {
    await this.trackEvent({
      name: 'session_action',
      properties: {
        action,
        session_id: sessionId,
      },
    });
  }

  async trackError(error: Error, context?: Record<string, any>) {
    await this.trackEvent({
      name: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
    });
  }

  async trackPerformance(metric: string, value: number, unit: string = 'ms') {
    await this.trackEvent({
      name: 'performance_metric',
      properties: {
        metric,
        value,
        unit,
      },
    });
  }

  async getRealTimeStats(): Promise<any> {
    return {
      totalScans: 0,
      activeSessions: 0,
      errorRate: 0,
      averageRate: 0,
    };
  }

  async getSessionHistory(limit: number = 10): Promise<any[]> {
    return [];
  }

  async getPerformanceReport(timeRange: 'hour' | 'day' | 'week'): Promise<any> {
    return {
      throughput: 0,
      accuracy: 100,
      stability: 100,
      timeRange,
    };
  }
}

export const analyticsService = new AnalyticsService();
export const analytics = analyticsService;
