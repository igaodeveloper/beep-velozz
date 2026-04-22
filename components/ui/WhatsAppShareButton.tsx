/**
 * WhatsApp Share Button Component
 * Componente profissional de botão para compartilhamento no WhatsApp
 */

import React, { useState, useCallback, memo } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { whatsappShareService, ShareOptions, ShareResult } from "@/services/whatsappShareService";
import * as Haptics from "expo-haptics";

interface WhatsAppShareButtonProps {
  session?: any;
  package?: any;
  options?: ShareOptions;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  onShareStart?: () => void;
  onShareComplete?: (result: ShareResult) => void;
  style?: any;
}

const WhatsAppShareButton = memo<WhatsAppShareButtonProps>(({
  session,
  package: pkg,
  options = {},
  size = "medium",
  variant = "primary",
  disabled = false,
  onShareStart,
  onShareComplete,
  style,
}) => {
  const { colors } = useAppTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [shareProgress] = useState(new Animated.Value(0));

  // Configurações de tamanho
  const sizeConfig = {
    small: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
      iconSize: 16,
    },
    medium: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      iconSize: 18,
    },
    large: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 16,
      iconSize: 20,
    },
  };

  // Configurações de estilo
  const getVariantStyles = useCallback(() => {
    const config = sizeConfig[size];
    
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#25D366", // WhatsApp green
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: "#25D366",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: "#25D366",
        };
      default:
        return {
          backgroundColor: "#25D366",
          borderWidth: 0,
        };
    }
  }, [variant, size, colors.surface]);

  // Animação de progresso
  const startProgressAnimation = useCallback(() => {
    Animated.timing(shareProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [shareProgress]);

  // Animação de reset
  const resetProgressAnimation = useCallback(() => {
    Animated.timing(shareProgress, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [shareProgress]);

  // Handler de compartilhamento
  const handleShare = useCallback(async () => {
    if (isSharing || disabled || (!session && !pkg)) {
      // Feedback visual para botão desabilitado
      if (disabled) {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      return;
    }

    try {
      setIsSharing(true);
      onShareStart?.();

      // Feedback tátil inicial
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Inicia animação de progresso
      startProgressAnimation();

      let result: ShareResult;

      if (session) {
        result = await whatsappShareService.shareSession(session, options);
      } else if (pkg) {
        result = await whatsappShareService.sharePackage(pkg, session);
      } else {
        throw new Error("Nenhum conteúdo para compartilhar");
      }

      // Reset animação
      resetProgressAnimation();

      // Feedback baseado no resultado
      if (result.success) {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            result.method === 'whatsapp' 
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning
          );
        }

        // Feedback visual adicional para clipboard
        if (result.method === 'clipboard') {
          // Alert já é mostrado pelo serviço
          console.log("Mensagem copiada para clipboard");
        }
      } else {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        // Alert mais informativo
        Alert.alert(
          "❌ Erro ao Compartilhar",
          result.error || "Não foi possível compartilhar a mensagem. Tente novamente.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Tentar Novamente", 
              onPress: () => handleShare() // Retry
            }
          ]
        );
      }

      onShareComplete?.(result);

    } catch (error) {
      console.error("Erro no compartilhamento:", error);
      resetProgressAnimation();

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      Alert.alert(
        "⚠️ Erro Inesperado",
        "Ocorreu um erro inesperado ao tentar compartilhar. Por favor, tente novamente.",
        [
          { text: "OK", style: "default" },
          { 
            text: "Tentar Novamente", 
            onPress: () => handleShare() // Retry
          }
        ]
      );

      onShareComplete?.({
        success: false,
        method: 'general',
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });

    } finally {
      setIsSharing(false);
    }
  }, [
    isSharing,
    disabled,
    session,
    pkg,
    options,
    onShareStart,
    onShareComplete,
    startProgressAnimation,
    resetProgressAnimation,
  ]);

  // Handler alternativo para fallback direto
  const handleFallbackShare = useCallback(async () => {
    if (isSharing || disabled || (!session && !pkg)) return;

    try {
      setIsSharing(true);
      
      // Usa compartilhamento geral com opções modificadas para forçar fallback
      const fallbackOptions = { ...options, recipientPhone: "force-fallback" };
      let result: ShareResult;
      
      if (session) {
        result = await whatsappShareService.shareSession(session, fallbackOptions);
      } else if (pkg) {
        result = await whatsappShareService.sharePackage(pkg, session);
      } else {
        throw new Error("Nenhum conteúdo para compartilhar");
      }

      onShareComplete?.(result);
    } catch (error) {
      console.error("Erro no fallback:", error);
      Alert.alert(
        "Erro",
        "Não foi possível compartilhar. Tente reiniciar o aplicativo.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, disabled, session, pkg, options, onShareComplete]);

  // Estilos dinâmicos
  const config = sizeConfig[size];
  const variantStyles = getVariantStyles();
  const textColor = variant === "primary" ? "#FFFFFF" : "#25D366";

  const buttonStyle = [
    {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: config.paddingHorizontal,
      paddingVertical: config.paddingVertical,
      borderRadius: size === "small" ? 6 : size === "medium" ? 8 : 12,
      opacity: (disabled || isSharing) ? 0.6 : 1,
      ...variantStyles,
    },
    style,
  ];

  const textStyle = {
    color: textColor,
    fontSize: config.fontSize,
    fontWeight: "700" as const,
    marginLeft: 8,
  };

  // Icone WhatsApp (simples texto)
  const iconStyle = {
    fontSize: config.iconSize,
    color: textColor,
    fontWeight: "bold" as const,
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      onLongPress={handleFallbackShare}
      disabled={disabled || isSharing}
      activeOpacity={0.8}
      style={buttonStyle}
      delayLongPress={800}
    >
      {/* Progress indicator */}
      {isSharing && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: shareProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: size === "small" ? 6 : size === "medium" ? 8 : 12,
          }}
        />
      )}

      {/* Conteúdo */}
      {isSharing ? (
        <>
          <ActivityIndicator 
            size="small" 
            color={textColor}
            style={{ marginRight: 8 }}
          />
          <Text style={textStyle}>Compartilhando...</Text>
        </>
      ) : (
        <>
          <Text style={iconStyle}>📱</Text>
          <Text style={textStyle}>
            {size === "small" ? "WhatsApp" : "Compartilhar"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
});

WhatsAppShareButton.displayName = "WhatsAppShareButton";

export default WhatsAppShareButton;
