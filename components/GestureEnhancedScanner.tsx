/**
 * Gesture Enhanced Scanner Component
 * Componente de scanner com gestos nativos avançados
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { useAppTheme } from '@/utils/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { debounce } from '@/utils/performanceOptimizer';
import { shouldAnimate } from '@/utils/performanceOptimizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GestureEnhancedScannerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onCircleGesture?: () => void;
  onFlashToggle?: () => void;
  children?: React.ReactNode;
  showGestureHints?: boolean;
  gestureSensitivity?: 'low' | 'medium' | 'high';
}

const GestureEnhancedScanner: React.FC<GestureEnhancedScannerProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  onCircleGesture,
  onFlashToggle,
  children,
  showGestureHints = true,
  gestureSensitivity = 'medium',
}) => {
  const { colors } = useAppTheme();
  const [scale, setScale] = useState(1);
  const [flashOn, setFlashOn] = useState(false);
  const [showHints, setShowHints] = useState(showGestureHints);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [circleProgress, setCircleProgress] = useState(0);
  
  // Animações
  const hintAnimation = useRef(new Animated.Value(0)).current;
  const gestureFeedbackAnimation = useRef(new Animated.Value(0)).current;
  const circleAnimation = useRef(new Animated.Value(0)).current;

  // Configurações de sensibilidade
  const sensitivityConfig = {
    low: { swipeThreshold: 100, pinchThreshold: 0.1, longPressDuration: 1000 },
    medium: { swipeThreshold: 50, pinchThreshold: 0.05, longPressDuration: 800 },
    high: { swipeThreshold: 25, pinchThreshold: 0.02, longPressDuration: 500 },
  };

  const config = sensitivityConfig[gestureSensitivity];

  // Refs para gestos
  const panRef = useRef<PanGestureHandler>(null);
  const pinchRef = useRef<PinchGestureHandler>(null);
  const tapRef = useRef<TapGestureHandler>(null);
  const longPressRef = useRef<LongPressGestureHandler>(null);

  // Animação de feedback
  const triggerGestureFeedback = useCallback((gestureType: string) => {
    setLastGesture(gestureType);
    
    if (shouldAnimate()) {
      Animated.sequence([
        Animated.timing(gestureFeedbackAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(gestureFeedbackAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Haptic feedback baseado no tipo de gesto
    switch (gestureType) {
      case 'swipe':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'pinch':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'longPress':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'doubleTap':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'circle':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }

    // Esconde o feedback após 2 segundos
    setTimeout(() => setLastGesture(''), 2000);
  }, [gestureFeedbackAnimation]);

  // Handler para gesto de pan/swipe
  const onPanGestureEvent = useCallback((event: any) => {
    const { translationX, translationY, state } = event.nativeEvent;
    
    if (state === State.END) {
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      
      if (absX > config.swipeThreshold || absY > config.swipeThreshold) {
        if (absX > absY) {
          // Swipe horizontal
          if (translationX > 0) {
            onSwipeRight?.();
            triggerGestureFeedback('swipe-right');
          } else {
            onSwipeLeft?.();
            triggerGestureFeedback('swipe-left');
          }
        } else {
          // Swipe vertical
          if (translationY > 0) {
            onSwipeDown?.();
            triggerGestureFeedback('swipe-down');
          } else {
            onSwipeUp?.();
            triggerGestureFeedback('swipe-up');
          }
        }
      }
    }
  }, [config.swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, triggerGestureFeedback]);

  // Handler para pinch zoom
  const onPinchGestureEvent = useCallback((event: any) => {
    const { scale: newScale, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      setScale(newScale);
      onPinch?.(newScale);
      
      if (Math.abs(newScale - 1) > config.pinchThreshold) {
        triggerGestureFeedback('pinch');
      }
    }
  }, [config.pinchThreshold, onPinch, triggerGestureFeedback]);

  // Handler para tap simples
  const onTapGestureEvent = useCallback((event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === State.END) {
      onTap?.();
      triggerGestureFeedback('tap');
    }
  }, [onTap, triggerGestureFeedback]);

  // Handler para double tap
  const handleDoubleTap = useCallback(() => {
    onDoubleTap?.();
    triggerGestureFeedback('doubleTap');
    
    // Toggle flash no double tap
    setFlashOn(!flashOn);
    onFlashToggle?.();
  }, [onDoubleTap, onFlashToggle, triggerGestureFeedback, flashOn]);

  // Handler para long press
  const onLongPressGestureEvent = useCallback((event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      onLongPress?.();
      triggerGestureFeedback('longPress');
    }
  }, [onLongPress, triggerGestureFeedback]);

  // Detecção de gesto circular (simplificado)
  const detectCircleGesture = useCallback((points: Array<{x: number, y: number}>) => {
    if (points.length < 10) return false;
    
    // Verifica se os pontos formam um círculo aproximado
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    const distances = points.map(p => 
      Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
    );
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    
    // Se a variância for baixa, é um círculo
    return variance < avgDistance * 0.3;
  }, []);

  // Simulação de gesto circular (seria implementado com tracking contínuo)
  const simulateCircleGesture = useCallback(() => {
    if (shouldAnimate()) {
      Animated.timing(circleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCircleProgress(1);
        onCircleGesture?.();
        triggerGestureFeedback('circle');
        
        // Reset
        setTimeout(() => {
          setCircleProgress(0);
          circleAnimation.setValue(0);
        }, 1000);
      });
    }
  }, [onCircleGesture, triggerGestureFeedback, circleAnimation]);

  // Mostra/esconde dicas de gestos
  const toggleHints = useCallback(() => {
    setShowHints(!showHints);
    
    if (shouldAnimate()) {
      Animated.timing(hintAnimation, {
        toValue: showHints ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showHints, hintAnimation]);

  // Debounced para toggle hints
  const debouncedToggleHints = debounce(toggleHints, 300);

  // Estilos dinâmicos
  const containerStyle = [
    styles.container,
    { backgroundColor: colors.bg },
  ];

  const gestureFeedbackStyle = [
    styles.gestureFeedback,
    {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
      opacity: gestureFeedbackAnimation,
    },
  ];

  const feedbackTextStyle = [
    styles.feedbackText,
    { color: colors.text },
  ];

  const hintContainerStyle = [
    styles.hintContainer,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      opacity: hintAnimation,
    },
  ];

  const hintTextStyle = [
    styles.hintText,
    { color: colors.secondary },
  ];

  const circleProgressStyle = [
    styles.circleProgress,
    {
      borderColor: colors.primary,
      transform: [{ scale: circleAnimation }],
    },
  ];

  return (
    <View style={containerStyle}>
      {/* Gesture Handlers */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanGestureEvent}
        minDist={10}
        minPointers={1}
        maxPointers={1}
      >
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={onPinchGestureEvent}
        >
          <TapGestureHandler
            ref={tapRef}
            onHandlerStateChange={onTapGestureEvent}
            numberOfTaps={1}
          >
            <TapGestureHandler
              onHandlerStateChange={handleDoubleTap}
              numberOfTaps={2}
            >
              <LongPressGestureHandler
                ref={longPressRef}
                onHandlerStateChange={onLongPressGestureEvent}
                minDurationMs={config.longPressDuration}
              >
                <View style={styles.gestureArea}>
                  {/* Conteúdo do scanner */}
                  {children}
                  
                  {/* Indicador de flash */}
                  {flashOn && (
                    <View style={[styles.flashIndicator, { backgroundColor: colors.primary }]}>
                      <Ionicons name="flashlight" size={24} color="#fff" />
                    </View>
                  )}

                  {/* Indicador de zoom */}
                  {scale !== 1 && (
                    <View style={[styles.zoomIndicator, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.zoomText, { color: colors.text }]}>
                        Zoom: {Math.round(scale * 100)}%
                      </Text>
                    </View>
                  )}

                  {/* Feedback visual de gestos */}
                  {lastGesture && (
                    <Animated.View style={gestureFeedbackStyle}>
                      <Text style={feedbackTextStyle}>
                        {getGestureEmoji(lastGesture)} {getGestureName(lastGesture)}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Progresso do gesto circular */}
                  {circleProgress > 0 && (
                    <Animated.View style={circleProgressStyle}>
                      <View style={[styles.circleProgressInner, { borderColor: colors.primary }]} />
                    </Animated.View>
                  )}

                  {/* Dicas de gestos */}
                  {showHints && (
                    <Animated.View style={hintContainerStyle}>
                      <Text style={hintTextStyle}>🎯 Gestos Disponíveis:</Text>
                      <Text style={hintTextStyle}>• Swipe: Navegar</Text>
                      <Text style={hintTextStyle}>• Pinch: Zoom</Text>
                      <Text style={hintTextStyle}>• Double Tap: Flash</Text>
                      <Text style={hintTextStyle}>• Long Press: Menu</Text>
                      <Text style={hintTextStyle}>• Circle: Modo avançado</Text>
                      <TouchableOpacity
                        style={[styles.hintClose, { backgroundColor: colors.primary }]}
                        onPress={debouncedToggleHints}
                      >
                        <Text style={styles.hintCloseText}>Fechar</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Botão de ajuda */}
                  <TouchableOpacity
                    style={[styles.helpButton, { backgroundColor: colors.surface }]}
                    onPress={debouncedToggleHints}
                  >
                    <Ionicons name="hand-left-outline" size={20} color={colors.secondary} />
                  </TouchableOpacity>

                  {/* Botão para teste de gesto circular */}
                  {__DEV__ && (
                    <TouchableOpacity
                      style={[styles.testCircleButton, { backgroundColor: colors.primary }]}
                      onPress={simulateCircleGesture}
                    >
                      <Text style={styles.testButtonText}>Testar Círculo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LongPressGestureHandler>
            </TapGestureHandler>
          </TapGestureHandler>
        </PinchGestureHandler>
      </PanGestureHandler>
    </View>
  );
};

// Funções auxiliares
const getGestureEmoji = (gesture: string): string => {
  const emojiMap: Record<string, string> = {
    'swipe-left': '👈',
    'swipe-right': '👉',
    'swipe-up': '👆',
    'swipe-down': '👇',
    'swipe': '👋',
    'pinch': '🤏',
    'tap': '👆',
    'doubleTap': '👆👆',
    'longPress': '👌',
    'circle': '⭕',
  };
  
  return emojiMap[gesture] || '👋';
};

const getGestureName = (gesture: string): string => {
  const nameMap: Record<string, string> = {
    'swipe-left': 'Swipe Esquerda',
    'swipe-right': 'Swipe Direita',
    'swipe-up': 'Swipe Cima',
    'swipe-down': 'Swipe Baixo',
    'swipe': 'Swipe',
    'pinch': 'Pinch Zoom',
    'tap': 'Toque Simples',
    'doubleTap': 'Toque Duplo',
    'longPress': 'Pressão Longa',
    'circle': 'Gesto Circular',
  };
  
  return nameMap[gesture] || 'Gesto';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureArea: {
    flex: 1,
    position: 'relative',
  },
  flashIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  zoomIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    elevation: 3,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gestureFeedback: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    elevation: 3,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
  circleProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleProgressInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
  },
  hintText: {
    fontSize: 12,
    marginBottom: 4,
  },
  hintClose: {
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  hintCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
  helpButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  testCircleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default GestureEnhancedScanner;
