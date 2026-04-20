/**
 * Improved Share Button Component
 * Botão de compartilhamento melhorado com múltiplas opções e fallback robusto
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
  Share,
  Linking,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { whatsappShareService, ShareOptions, ShareResult } from "@/services/whatsappShareService";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

interface ImprovedShareButtonProps {
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

const ImprovedShareButton = memo<ImprovedShareButtonProps>(({
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

  // Função de compartilhamento direto (Share API)
  const shareDirectly = useCallback(async (message: string): Promise<ShareResult> => {
    try {
      await Share.share({
        message,
        title: "Relatório Beep Velozz",
        url: undefined
      });

      return {
        success: true,
        method: 'general'
      };
    } catch (error) {
      throw new Error("Compartilhamento falhou");
    }
  }, []);

  // Função de clipboard
  const copyToClipboard = useCallback(async (message: string): Promise<ShareResult> => {
    try {
      if (Platform.OS === "web" as any) {
        throw new Error("Clipboard não disponível na web");
      }

      await Clipboard.setStringAsync(message);

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        " Mensagem Copiada!",
        "A mensagem foi copiada para a área de transferência.\n\nCole no aplicativo de sua escolha.",
        [
          { text: "OK" },
          { 
            text: "Abrir WhatsApp", 
            onPress: async () => {
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
          }
        ]
      );

      return {
        success: true,
        method: 'clipboard'
      };
    } catch (error) {
      throw new Error("Falha ao copiar mensagem");
    }
  }, []);

  // Handler principal de compartilhamento
  const handleShare = useCallback(async () => {
    if (isSharing || disabled || (!session && !pkg)) {
      if (disabled && Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    try {
      setIsSharing(true);
      onShareStart?.();

      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      startProgressAnimation();

      let result: ShareResult;

      // Tenta compartilhamento via WhatsApp primeiro
      if (session) {
        result = await whatsappShareService.shareSession(session, options);
      } else if (pkg) {
        result = await whatsappShareService.sharePackage(pkg, session);
      } else {
        throw new Error("Nenhum conteúdo para compartilhar");
      }

      resetProgressAnimation();

      if (result.success) {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            result.method === 'whatsapp' 
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning
          );
        }
      } else {
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        Alert.alert(
          " Erro ao Compartilhar",
          result.error || "Não foi possível compartilhar a mensagem. Tente novamente.",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Tentar Novamente", 
              onPress: () => handleShare() 
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
        " Erro Inesperado",
        "Ocorreu um erro inesperado. Por favor, tente novamente.",
        [
          { text: "OK", style: "default" },
          { 
            text: "Tentar Novamente", 
            onPress: () => handleShare() 
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

  // Handler para compartilhamento alternativo
  const handleAlternativeShare = useCallback(async () => {
    if (isSharing || disabled || (!session && !pkg)) return;

    try {
      setIsSharing(true);
      
      // Mostra opções de compartilhamento
      Alert.alert(
        " Opções de Compartilhamento",
        "Escolha como deseja compartilhar:",
        [
          {
            text: "Compartilhamento Padrão",
            onPress: async () => {
              try {
                const message = session 
                  ? "Relatório da sessão de conferência de pacotes"
                  : "Pacote escaneado";
                
                const result = await shareDirectly(message);
                onShareComplete?.(result);
              } catch (error) {
                console.error("Erro no compartilhamento padrão:", error);
              }
            }
          },
          {
            text: "Copiar Mensagem",
            onPress: async () => {
              try {
                const message = session 
                  ? "Relatório da sessão de conferência de pacotes"
                  : "Pacote escaneado";
                
                const result = await copyToClipboard(message);
                onShareComplete?.(result);
              } catch (error) {
                console.error("Erro ao copiar:", error);
              }
            }
          },
          {
            text: "Cancelar",
            style: "cancel"
          }
        ]
      );
    } catch (error) {
      console.error("Erro no compartilhamento alternativo:", error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, disabled, session, pkg, shareDirectly, copyToClipboard, onShareComplete]);

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

  const iconStyle = {
    fontSize: config.iconSize,
    color: textColor,
    fontWeight: "bold" as const,
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      onLongPress={handleAlternativeShare}
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
          <Text style={iconStyle}> </Text>
          <Text style={textStyle}>
            {size === "small" ? "Compartilhar" : "Compartilhar"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
});

ImprovedShareButton.displayName = "ImprovedShareButton";

export default ImprovedShareButton;
