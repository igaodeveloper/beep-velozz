/**
 * Smart Notifications System
 * Sistema de notificações inteligentes em tempo real
 */

import { Session, ScannedPackage } from "@/types/session";
import { PatternInsight } from "@/utils/aiPatternRecognition";
import { Platform } from "react-native";

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "error" | "success";
  priority: "low" | "normal" | "high" | "urgent";
  category: "performance" | "quality" | "efficiency" | "compliance";
  timestamp: number;
  sessionId?: string;
  actionable: boolean;
}

class SmartNotificationManager {
  private notifications: SmartNotification[] = [];
  private isEnabled: boolean = true;
  private quietHours: { start: string; end: string } | null = null;

  constructor() {
    this.requestPermissions();
  }

  /**
   * Solicita permissões de notificação
   */
  private async requestPermissions(): Promise<void> {
    // TODO: Implementar com expo-notifications quando disponível
    console.log("Notification permissions requested");
  }

  /**
   * Processa insights da IA e gera notificações
   */
  async processAIInsights(
    insights: PatternInsight[],
    session?: Session,
  ): Promise<void> {
    for (const insight of insights) {
      if (this.shouldNotify(insight)) {
        const notification = this.createNotificationFromInsight(
          insight,
          session,
        );
        await this.sendNotification(notification);
      }
    }
  }

  /**
   * Processa eventos de sessão em tempo real
   */
  async processSessionEvent(
    event: string,
    session: Session,
    data?: any,
  ): Promise<void> {
    // Implementar lógica baseada em eventos
    if (event === "session_completed" && session.hasDivergence) {
      await this.sendNotification({
        id: `divergence_${Date.now()}`,
        title: "⚠️ Divergência Detectada",
        body: "Sessão concluída com divergência. Verifique os pacotes.",
        type: "warning",
        priority: "high",
        category: "compliance",
        timestamp: Date.now(),
        sessionId: session.id,
        actionable: true,
      });
    }

    if (event === "milestone_reached") {
      await this.sendNotification({
        id: `milestone_${Date.now()}`,
        title: "🎯 Marco Alcançado",
        body: data?.message || "Ótimo progresso!",
        type: "success",
        priority: "low",
        category: "performance",
        timestamp: Date.now(),
        sessionId: session.id,
        actionable: false,
      });
    }
  }

  /**
   * Verifica se deve notificar baseado no contexto
   */
  private shouldNotify(insight: PatternInsight): boolean {
    if (!this.isEnabled) return false;

    // Respeita horário de silêncio
    if (this.quietHours && this.isQuietHours()) {
      return insight.severity === "critical";
    }

    // Verifica se já notificou recentemente sobre o mesmo padrão
    const recentNotification = this.notifications.find(
      (n) =>
        n.category === insight.category &&
        Date.now() - n.timestamp < 5 * 60 * 1000, // 5 minutos
    );

    return !recentNotification;
  }

  /**
   * Cria notificação a partir de insight da IA
   */
  private createNotificationFromInsight(
    insight: PatternInsight,
    session?: Session,
  ): SmartNotification {
    const emoji = this.getEmojiForType(insight.type);
    const priority = this.mapSeverityToPriority(insight.severity);

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${emoji} ${insight.title}`,
      body: insight.description,
      type: this.mapInsightType(insight.type),
      priority,
      category: insight.category,
      timestamp: Date.now(),
      sessionId: session?.id,
      actionable: insight.actionable,
    };
  }

  /**
   * Envia notificação
   */
  private async sendNotification(
    notification: SmartNotification,
  ): Promise<void> {
    try {
      // Armazena localmente
      this.notifications.push(notification);

      // Envia notificação push (apenas em mobile)
      if (Platform.OS !== "web") {
        // TODO: Implementar com expo-notifications quando disponível
        console.log("Notification sent:", notification.title);
      }

      // Callback para ações (implementado no componente)
      this.onNotificationReceived?.(notification);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  // Métodos utilitários
  private getEmojiForType(type: PatternInsight["type"]): string {
    const emojis = {
      anomaly: "⚠️",
      prediction: "🔮",
      recommendation: "💡",
      warning: "⚡",
    };
    return emojis[type] || "📢";
  }

  private mapInsightType(
    type: PatternInsight["type"],
  ): SmartNotification["type"] {
    const mapping: Record<PatternInsight["type"], SmartNotification["type"]> = {
      anomaly: "warning",
      prediction: "info",
      recommendation: "info",
      warning: "warning",
    };
    return mapping[type] || "info";
  }

  private mapSeverityToPriority(
    severity: PatternInsight["severity"],
  ): SmartNotification["priority"] {
    const mapping: Record<
      PatternInsight["severity"],
      SmartNotification["priority"]
    > = {
      low: "low",
      medium: "normal",
      high: "high",
      critical: "urgent",
    };
    return mapping[severity] || "normal";
  }

  private isQuietHours(): boolean {
    if (!this.quietHours) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(this.quietHours.start.split(":")[0]);
    const endHour = parseInt(this.quietHours.end.split(":")[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  /**
   * Habilita/desabilita notificações
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Configura horário de silêncio
   */
  setQuietHours(start: string, end: string): void {
    this.quietHours = { start, end };
  }

  /**
   * Obtém histórico de notificações
   */
  getNotificationHistory(): SmartNotification[] {
    return [...this.notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Limpa histórico de notificações
   */
  clearHistory(): void {
    this.notifications = [];
  }

  /**
   * Callback para quando notificação é recebida
   */
  onNotificationReceived?: (notification: SmartNotification) => void;

  /**
   * Processa ação de notificação
   */
  async handleNotificationAction(
    notificationId: string,
    actionId: string,
  ): Promise<void> {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (!notification) return;

    console.log(`Notification action: ${actionId} for ${notification.title}`);

    // Implementar lógica específica para cada ação
    switch (actionId) {
      case "view_details":
        // Navegar para detalhes
        break;
      case "pause":
        // Pausar sessão
        break;
      case "review":
        // Abrir modal de revisão
        break;
      case "dismiss":
        // Apenas ignorar
        break;
    }
  }
}

// Export singleton
export const smartNotificationManager = new SmartNotificationManager();
