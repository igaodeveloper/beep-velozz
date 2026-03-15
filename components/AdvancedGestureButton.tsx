import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';
import { advancedHaptics } from '@/utils/advancedHaptics';

interface AdvancedGestureButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
  style?: any;
  disabled?: boolean;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  pressAnimation?: boolean;
  longPressDelay?: number;
  swipeThreshold?: number;
  doubleTapDelay?: number;
}

export function AdvancedGestureButton({
  children,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onPinch,
  style,
  disabled = false,
  hapticFeedback = true,
  rippleEffect = true,
  pressAnimation = true,
  longPressDelay = 500,
  swipeThreshold = 50,
  doubleTapDelay = 300,
}: AdvancedGestureButtonProps) {
  const { colors } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const rippleScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const longPressProgress = useSharedValue(0);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animação de ripple effect
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: interpolate(rippleScale.value, [0, 1], [0.6, 0]),
  }));

  // Animação do botão
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}rad` },
    ],
    opacity: disabled ? 0.5 : 1,
  }));

  // Animação de progresso de long press
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: longPressProgress.value }],
    opacity: longPressProgress.value,
  }));

  // Gesture handler para pan (swipe)
  const onPanGestureEvent = (event: any) => {
    if (disabled) return;
    
    translateX.value = event.translationX;
    translateY.value = event.translationY;
    
    // Adiciona rotação sutil baseada no movimento
    rotation.value = interpolate(
      Math.abs(event.translationX),
      [0, 100],
      [0, 0.05],
      Extrapolate.CLAMP
    );
  };

  const onPanGestureEnd = (event: any) => {
    if (disabled) return;
    
    const swipeX = event.translationX;
    const swipeY = event.translationY;
    
    // Detecta swipe directions
    if (Math.abs(swipeX) > Math.abs(swipeY)) {
      if (Math.abs(swipeX) > swipeThreshold) {
        if (swipeX > 0) {
          onSwipeRight?.();
          if (hapticFeedback) advancedHaptics.onSwipe();
        } else {
          onSwipeLeft?.();
          if (hapticFeedback) advancedHaptics.onSwipe();
        }
      }
    } else {
      if (Math.abs(swipeY) > swipeThreshold) {
        if (swipeY > 0) {
          onSwipeDown?.();
          if (hapticFeedback) advancedHaptics.onSwipe();
        } else {
          onSwipeUp?.();
          if (hapticFeedback) advancedHaptics.onSwipe();
        }
      }
    }
    
    // Reset animations
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotation.value = withSpring(0);
  };

  // Gesture handler para tap
  const onTapStart = () => {
    if (disabled) return;
    
    if (pressAnimation) {
      buttonScale.value = withSpring(0.95);
    }
    
    if (rippleEffect) {
      rippleScale.value = withTiming(1, { duration: 600 });
    }
  };

  const onTapEnd = () => {
    if (disabled) return;
    
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
      // Double tap detected
      onDoubleTap();
      if (hapticFeedback) advancedHaptics.trigger({ type: 'success', pattern: 'double' });
    } else if (onPress) {
      // Single tap
      onPress();
      if (hapticFeedback) advancedHaptics.onButtonPress();
    }
    
    setLastTapTime(currentTime);
    
    // Reset animations
    buttonScale.value = withSpring(1);
    setTimeout(() => {
      rippleScale.value = 0;
    }, 600);
  };

  // Gesture handler para long press
  const onLongPressStart = () => {
    if (disabled) return;
    
    if (pressAnimation) {
      buttonScale.value = withSpring(0.9);
    }
    
    // Start long press progress
    longPressProgress.value = withTiming(1, { duration: longPressDelay });
    
    // Start timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
        if (hapticFeedback) advancedHaptics.onLongPress();
      }
    }, longPressDelay) as unknown as NodeJS.Timeout;
  };

  const onLongPressActive = () => {
    if (disabled) return;
    
    // Vibration effect during long press
    buttonScale.value = withTiming(
      0.85 + Math.random() * 0.1,
      { duration: 50 }
    );
  };

  const onLongPressEnd = () => {
    if (disabled) return;
    
    // Clear timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Reset animations
    buttonScale.value = withSpring(1);
    longPressProgress.value = withTiming(0, { duration: 200 });
  };

  return (
    <View style={[styles.container, style]}>
      <LongPressGestureHandler
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.BEGAN) {
            onLongPressStart();
          } else if (event.nativeEvent.state === State.ACTIVE) {
            onLongPressActive();
          } else if (event.nativeEvent.state === State.END) {
            onLongPressEnd();
          }
        }}
        minDurationMs={longPressDelay}
      >
        <Animated.View>
          <PanGestureHandler 
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={(event) => {
              if (event.nativeEvent.state === State.END) {
                onPanGestureEnd(event.nativeEvent);
              }
            }}
          >
            <Animated.View>
              <TapGestureHandler
                onHandlerStateChange={(event) => {
                  if (event.nativeEvent.state === State.BEGAN) {
                    onTapStart();
                  } else if (event.nativeEvent.state === State.END) {
                    onTapEnd();
                  }
                }}
                numberOfTaps={1}
              >
                <Animated.View
                  style={[
                    styles.button,
                    buttonStyle,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Ripple Effect */}
                  {rippleEffect && (
                    <Animated.View
                      style={[
                        styles.ripple,
                        rippleStyle,
                        {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  )}
                  
                  {/* Long Press Progress */}
                  <Animated.View
                    style={[
                      styles.progressBar,
                      progressStyle,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  
                  {/* Content */}
                  <View style={styles.content}>
                    {children}
                  </View>
                </Animated.View>
              </TapGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </LongPressGestureHandler>
    </View>
  );
}

// Componente de Swipe Card
interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  style?: any;
  snapBack?: boolean;
  threshold?: number;
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  style,
  snapBack = true,
  threshold = 100,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const onSwipeGestureEvent = (event: any) => {
    translateX.value = event.translationX;
    translateY.value = event.translationY;
    
    // Adiciona rotação baseada no movimento horizontal
    rotate.value = interpolate(
      event.translationX,
      [-200, 200],
      [-0.2, 0.2],
      Extrapolate.CLAMP
    );
    
    // Adiciona escala baseada na distância
    const distance = Math.sqrt(
      Math.pow(event.translationX, 2) + Math.pow(event.translationY, 2)
    );
    scale.value = interpolate(
      distance,
      [0, 300],
      [1, 0.9],
      Extrapolate.CLAMP
    );
  };

  const onSwipeGestureEnd = (event: any) => {
    const swipeX = event.translationX;
    const swipeY = event.translationY;
    
    let actionTriggered = false;
    
    // Detecta swipe directions
    if (Math.abs(swipeX) > Math.abs(swipeY)) {
      if (Math.abs(swipeX) > threshold) {
        if (swipeX > 0 && onSwipeRight) {
          onSwipeRight();
          actionTriggered = true;
        } else if (swipeX < 0 && onSwipeLeft) {
          onSwipeLeft();
          actionTriggered = true;
        }
      }
    } else {
      if (Math.abs(swipeY) > threshold) {
        if (swipeY > 0 && onSwipeDown) {
          onSwipeDown();
          actionTriggered = true;
        } else if (swipeY < 0 && onSwipeUp) {
          onSwipeUp();
          actionTriggered = true;
        }
      }
    }
    
    if (actionTriggered && !snapBack) {
      // Anima para fora da tela
      opacity.value = withTiming(0, { duration: 300 });
      translateX.value = withTiming(swipeX * 2, { duration: 300 });
      translateY.value = withTiming(swipeY * 2, { duration: 300 });
    } else {
      // Snap back to center
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      rotate.value = withSpring(0);
      scale.value = withSpring(1);
    }
  };

  return (
    <PanGestureHandler 
      onGestureEvent={onSwipeGestureEvent}
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.END) {
          onSwipeGestureEnd(event.nativeEvent);
        }
      }}
    >
      <Animated.View style={[styles.swipeCard, cardStyle, style]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  button: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    zIndex: 1,
  },
  swipeCard: {
    borderRadius: 12,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
