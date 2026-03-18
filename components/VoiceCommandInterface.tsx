/**
 * Voice Command Interface Component
 * Interface de comandos de voz com feedback visual e auditivo
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Alert,
  Vibration,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useVoiceCommands, VoiceCommandResult } from '@/utils/voiceCommands';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { shouldAnimate } from '@/utils/performanceOptimizer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoiceCommandInterfaceProps {
  onCommand?: (result: VoiceCommandResult) => void;
  position?: 'bottom' | 'top' | 'center';
  size?: 'small' | 'medium' | 'large';
  showFeedback?: boolean;
  autoStart?: boolean;
}

const VoiceCommandInterface: React.FC<VoiceCommandInterfaceProps> = ({
  onCommand,
  position = 'bottom',
  size = 'medium',
  showFeedback = true,
  autoStart = false,
}) => {
  const { colors } = useAppTheme();
  const {
    isListening,
    isSupported,
    lastResult,
    startListening,
    stopListening,
    getAvailableCommands,
    simulateCommand,
  } = useVoiceCommands();

  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const feedbackAnimation = useRef(new Animated.Value(0)).current;

  // Configurações baseadas no tamanho
  const sizeConfig = {
    small: { buttonSize: 50, iconSize: 20, padding: 8 },
    medium: { buttonSize: 70, iconSize: 28, padding: 12 },
    large: { buttonSize: 90, iconSize: 36, padding: 16 },
  };

  const config = sizeConfig[size];

  // Animação de pulso quando ouvindo
  useEffect(() => {
    if (isListening && shouldAnimate()) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isListening, pulseAnimation]);

  // Feedback visual de comandos
  useEffect(() => {
    if (lastResult && showFeedback) {
      setFeedbackMessage(lastResult.response || (lastResult.error || ''));
      
      if (shouldAnimate()) {
        Animated.sequence([
          Animated.timing(feedbackAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(feedbackAnimation, {
            toValue: 0,
            duration: 300,
            delay: 2000,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Haptic feedback
      if (lastResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Notifica callback
      onCommand?.(lastResult);
    }
  }, [lastResult, showFeedback, onCommand, feedbackAnimation]);

  // Auto start
  useEffect(() => {
    if (autoStart && isSupported) {
      handleToggleListening();
    }
  }, [autoStart, isSupported]);

  // Handler para toggle de listening
  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      const success = await startListening();
      if (success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (shouldAnimate()) {
          Animated.timing(slideAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  }, [isListening, startListening, stopListening, slideAnimation]);

  // Handler para mostrar ajuda
  const handleShowHelp = useCallback(() => {
    setShowHelp(!showHelp);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [showHelp]);

  // Simula comando para teste
  const handleSimulateCommand = useCallback((command: string) => {
    const result = simulateCommand(command);
    setFeedbackMessage(result.response || (result.error || ''));
    onCommand?.(result);
  }, [simulateCommand, onCommand]);

  // Estilos dinâmicos baseados na posição
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          position: 'absolute' as const,
          top: 20,
          left: SCREEN_WIDTH / 2 - config.buttonSize / 2,
        };
      case 'center':
        return {
          position: 'absolute' as const,
          top: '50%' as const,
          left: SCREEN_WIDTH / 2 - config.buttonSize / 2,
          marginTop: -config.buttonSize / 2,
        };
      case 'bottom':
      default:
        return {
          position: 'absolute' as const,
          bottom: 30,
          left: SCREEN_WIDTH / 2 - config.buttonSize / 2,
        };
    }
  };

  // Estilos do botão principal
  const buttonStyle = [
    styles.voiceButton,
    {
      width: config.buttonSize,
      height: config.buttonSize,
      backgroundColor: isListening ? colors.primary : colors.surface,
      borderColor: isListening ? colors.primary : colors.border,
      transform: [{ scale: pulseAnimation }],
    },
  ];

  const buttonPositionStyle = getPositionStyles();

  const iconStyle = [
    styles.voiceIcon,
    {
      fontSize: config.iconSize,
      color: isListening ? '#fff' : colors.text,
    },
  ];

  // Estilos do feedback
  const feedbackStyle = [
    styles.feedbackContainer,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: feedbackAnimation,
      transform: [
        {
          translateY: feedbackAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    },
  ];

  const feedbackTextStyle = [
    styles.feedbackText,
    { color: colors.text },
  ];

  // Se não for suportado, mostra mensagem
  if (!isSupported) {
    return (
      <View style={[styles.notSupportedContainer, buttonPositionStyle]}>
        <Text style={[styles.notSupportedText, { color: colors.secondary }]}>
          🎤 Voice não disponível
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão principal de voz */}
      <View style={buttonPositionStyle}>
        <TouchableOpacity
          style={buttonStyle}
          onPress={handleToggleListening}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            style={iconStyle}
          />
        </TouchableOpacity>
      </View>

      {/* Indicador de status */}
      {isListening && (
        <View style={[styles.listeningIndicator, buttonPositionStyle]}>
          <Text style={[styles.listeningText, { color: colors.primary }]}>
            Ouvindo...
          </Text>
        </View>
      )}

      {/* Feedback visual */}
      {showFeedback && feedbackMessage && (
        <Animated.View style={feedbackStyle}>
          <Text style={feedbackTextStyle}>{feedbackMessage}</Text>
        </Animated.View>
      )}

      {/* Botão de ajuda */}
      <View style={[buttonPositionStyle, { right: config.padding + 5 }]}>
        <TouchableOpacity
          style={[
            styles.helpButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={handleShowHelp}
        >
          <Ionicons
            name="help-outline"
            size={20}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Modal de ajuda */}
      {showHelp && (
        <View style={styles.helpOverlay}>
          <View style={[styles.helpModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              🎤 Comandos de Voz
            </Text>
            <View style={styles.commandsList}>
              {getAvailableCommands().slice(0, 8).map((command, index) => (
                <Text
                  key={`command-${command}-${index}`}
                  style={[styles.commandItem, { color: colors.secondary }]}
                  onPress={() => {
                    handleSimulateCommand(command);
                    setShowHelp(false);
                  }}
                >
                  • {command}
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.helpClose, { backgroundColor: colors.primary }]}
              onPress={() => setShowHelp(false)}
            >
              <Text style={styles.helpCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botões de teste (development only) */}
      {__DEV__ && (
        <View style={styles.testButtons}>
          {['iniciar sessão', 'escanear', 'relatório', 'ajuda'].map((cmd) => (
            <TouchableOpacity
              key={cmd}
              style={[
                styles.testButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => handleSimulateCommand(cmd)}
            >
              <Text style={[styles.testButtonText, { color: colors.text }]}>
                {cmd}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  voiceButton: {
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  voiceIcon: {
    fontWeight: '600',
  },
  listeningIndicator: {
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  listeningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  helpButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  helpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  commandsList: {
    marginBottom: 20,
  },
  commandItem: {
    fontSize: 14,
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpClose: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
  notSupportedContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  notSupportedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  testButtons: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default VoiceCommandInterface;
