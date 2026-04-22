/**
 * WhatsApp Share Service
 * Serviço profissional para compartilhamento no WhatsApp com template personalizado
 */

import { Share, Platform, Linking, Alert } from "react-native";
import { Session, ScannedPackage } from "@/types/session";
import { formatWhatsAppMessage, formatDate, formatTimestamp } from "@/utils/session";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

export interface ShareOptions {
  includePhotos?: boolean;
  includeDetailedList?: boolean;
  customMessage?: string;
  recipientPhone?: string; // Opcional: número de telefone específico
}

export interface ShareResult {
  success: boolean;
  method: 'whatsapp' | 'general' | 'clipboard';
  error?: string;
}

class WhatsAppShareService {
  private static instance: WhatsAppShareService;

  static getInstance(): WhatsAppShareService {
    if (!WhatsAppShareService.instance) {
      WhatsAppShareService.instance = new WhatsAppShareService();
    }
    return WhatsAppShareService.instance;
  }

  /**
   * Compartilha sessão via WhatsApp com fallback inteligente
   */
  async shareSession(
    session: Session,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    try {
      // Feedback tátil profissional
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const message = this.buildMessage(session, options);
      
      // Tenta compartilhar via WhatsApp primeiro
      const whatsappResult = await this.shareViaWhatsApp(message, options.recipientPhone);
      
      if (whatsappResult.success) {
        return whatsappResult;
      }

      // Fallback para compartilhamento geral
      const generalResult = await this.shareViaGeneralShare(message);
      
      if (generalResult.success) {
        return generalResult;
      }

      // Último fallback: clipboard
      return await this.copyToClipboard(message);

    } catch (error) {
      console.error("Erro ao compartilhar sessão:", error);
      return {
        success: false,
        method: 'general',
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  /**
   * Compartilha pacote individual via WhatsApp
   */
  async sharePackage(
    pkg: ScannedPackage,
    sessionInfo?: Partial<Session>
  ): Promise<ShareResult> {
    try {
      // Feedback tátil
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const message = this.buildPackageMessage(pkg, sessionInfo);
      
      // Tenta WhatsApp primeiro
      const whatsappResult = await this.shareViaWhatsApp(message);
      
      if (whatsappResult.success) {
        return whatsappResult;
      }

      // Fallback
      return await this.shareViaGeneralShare(message);

    } catch (error) {
      console.error("Erro ao compartilhar pacote:", error);
      return {
        success: false,
        method: 'general',
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  /**
   * Compartilha via WhatsApp diretamente
   */
  private async shareViaWhatsApp(
    message: string,
    recipientPhone?: string
  ): Promise<ShareResult> {
    try {
      // Verifica se é um fallback forçado
      if (recipientPhone === "force-fallback") {
        throw new Error("Fallback forçado");
      }

      // Limita tamanho da mensagem para evitar problemas de URL
      const maxMessageLength = 8000;
      const truncatedMessage = message.length > maxMessageLength 
        ? message.substring(0, maxMessageLength) + "\n\n[Mensagem truncada por limite de caracteres]"
        : message;
      
      const encodedMessage = encodeURIComponent(truncatedMessage);
      const whatsappUrl = recipientPhone
        ? `https://wa.me/${recipientPhone.replace(/\D/g, '')}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;

      // Timeout para verificação de URL
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao verificar WhatsApp")), 5000);
      });

      const canOpen = await Promise.race([
        Linking.canOpenURL(whatsappUrl),
        timeoutPromise
      ]);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        
        // Feedback de sucesso
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return {
          success: true,
          method: 'whatsapp'
        };
      }

      throw new Error("WhatsApp não está disponível");

    } catch (error) {
      console.log("WhatsApp não disponível, usando fallback:", error);
      return {
        success: false,
        method: 'whatsapp',
        error: error instanceof Error ? error.message : "WhatsApp indisponível"
      };
    }
  }

  /**
   * Compartilhamento geral (Share API)
   */
  private async shareViaGeneralShare(message: string): Promise<ShareResult> {
    try {
      await Share.share({
        message,
        title: "Relatório Beep Velozz",
        url: undefined // Para compatibilidade com algumas plataformas
      });

      return {
        success: true,
        method: 'general'
      };

    } catch (error) {
      throw new Error("Compartilhamento falhou");
    }
  }

  /**
   * Copia para clipboard como último recurso
   */
  private async copyToClipboard(message: string): Promise<ShareResult> {
    try {
      // Verifica se clipboard está disponível
      if (Platform.OS === "web" as any) {
        throw new Error("Clipboard não disponível na web");
      }

      await Clipboard.setStringAsync(message);

      // Feedback visual/tátil
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "✅ Mensagem Copiada!",
        "A mensagem foi copiada para a área de transferência.\n\nAbra o WhatsApp e cole para enviar.",
        [
          { text: "OK" },
          { 
            text: "Abrir WhatsApp", 
            onPress: () => this.tryOpenWhatsAppDirectly() 
          }
        ]
      );

      return {
        success: true,
        method: 'clipboard'
      };

    } catch (error) {
      console.error("Erro ao copiar para clipboard:", error);
      throw new Error("Falha ao copiar mensagem");
    }
  }

  /**
   * Tenta abrir WhatsApp diretamente (sem mensagem)
   */
  private async tryOpenWhatsAppDirectly(): Promise<void> {
    try {
      const whatsappUrl = "https://wa.me/";
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      }
    } catch (error) {
      console.log("Não foi possível abrir WhatsApp:", error);
    }
  }

  /**
   * Constrói mensagem personalizada
   */
  private buildMessage(session: Session, options: ShareOptions): string {
    let message = formatWhatsAppMessage(session);

    // Adiciona mensagem customizada
    if (options.customMessage) {
      message = `${options.customMessage}\n\n${message}`;
    }

    // Adiciona lista detalhada de pacotes
    if (options.includeDetailedList && session.packages.length > 0) {
      const packageList = this.buildDetailedPackageList(session.packages);
      message += `\n\n*LISTA DETALHADA DE PACOTES*\n${packageList}`;
    }

    // Adiciona nota sobre fotos
    if (options.includePhotos) {
      message += `\n\n*FOTOS*\n Fotos dos pacotes foram anexadas separadamente.`;
    }

    // Assinatura profissional
    message += `\n\n---
*Enviado via Beep Velozz* 
Sistema Profissional de Scanner Industrial`;

    return message;
  }

  /**
   * Constrói mensagem para pacote individual
   */
  private buildPackageMessage(
    pkg: ScannedPackage,
    sessionInfo?: Partial<Session>
  ): string {
    const timestamp = formatTimestamp(pkg.scannedAt);
    const typeLabel = this.getPackageTypeLabel(pkg.type);
    const value = pkg.value ? ` | R$ ${pkg.value.toFixed(2).replace(".", ",")}` : "";

    let message = `*PACOTE ESCANEADO*\n`;
    message += `Código: ${pkg.code}\n`;
    message += `Tipo: ${typeLabel}${value}\n`;
    message += `Data/Hora: ${timestamp}`;

    if (sessionInfo) {
      message += `\n\n*CONTEXTO*\n`;
      if (sessionInfo.operatorName) {
        message += `Operador: ${sessionInfo.operatorName}\n`;
      }
      if (sessionInfo.driverName) {
        message += `Motorista: ${sessionInfo.driverName}\n`;
      }
      if (sessionInfo.startedAt) {
        message += `Sessão: ${formatDate(sessionInfo.startedAt)}\n`;
      }
    }

    message += `\n\n---
*Enviado via Beep Velozz*`;

    return message;
  }

  /**
   * Constrói lista detalhada de pacotes
   */
  private buildDetailedPackageList(packages: ScannedPackage[]): string {
    return packages
      .slice(0, 50) // Limita para evitar mensagens muito longas
      .map((pkg, index) => {
        const typeLabel = this.getPackageTypeLabel(pkg.type);
        const value = pkg.value ? ` | R$ ${pkg.value.toFixed(2).replace(".", ",")}` : "";
        const timestamp = formatTimestamp(pkg.scannedAt);
        
        return `${index + 1}. ${pkg.code} (${typeLabel}${value}) - ${timestamp}`;
      })
      .join('\n');
  }

  /**
   * Retorna label do tipo de pacote
   */
  private getPackageTypeLabel(type: string): string {
    const labels = {
      shopee: "Shopee",
      mercado_livre: "Mercado Livre",
      avulso: "Avulso",
      unknown: "Não identificado"
    };
    
    return labels[type as keyof typeof labels] || "Não identificado";
  }

  /**
   * Verifica se WhatsApp está disponível
   */
  async isWhatsAppAvailable(): Promise<boolean> {
    try {
      return await Linking.canOpenURL("https://wa.me/");
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const whatsappShareService = WhatsAppShareService.getInstance();
