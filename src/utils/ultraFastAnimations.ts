// src/utils/ultraFastAnimations.ts
/**
 * Ultra Fast Animations - 60fps Performance Optimized
 * Sistema de animações industrial com Reanimated 4 e hardware acceleration
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  runOnJS,
  interpolate,
  cancelAnimation,
  useDerivedValue,
  useAnimatedReaction,
  ReduceMotion,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Easing as NativeEasing } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Configurações de animação ultra rápida
export const ANIMATION_CONFIG = {
  // Durações otimizadas para 60fps
  DURATIONS: {
    INSTANT: 0,
    FAST: 120,    // 2 frames @ 60fps
    NORMAL: 200,  // ~3 frames @ 60fps
    SLOW: 300,    // 5 frames @ 60fps
    SMOOTH: 400,  // ~7 frames @ 60fps
  },
  
  // Spring physics
  SPRING: {
    DAMPING: 20,      // Menos damping = mais bouncy
    STIFFNESS: 100,   // Mais stiffness = mais rápido
    MASS: 1,         // Menos massa = mais responsivo
    VELOCITY: 0,     // Velocidade inicial
  },
  
  // Easing configurations - Use Reanimated Easing functions
  EASING: {
    EASE_IN: Easing.in(Easing.quad),
    EASE_OUT: Easing.out(Easing.quad),
    EASE_IN_OUT: Easing.inOut(Easing.quad),
    SHARP: Easing.bezier(0.9, 0, 1, 1),
    BOUNCE: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  },
  
  // Performance settings
  PERFORMANCE: {
    REDUCE_MOTION: ReduceMotion.Never,
    USE_NATIVE_DRIVER: true,
    SKIP_FRAMES: false,
    BATCH_UPDATES: true,
  },
};

// Hook para animações básicas otimizadas
export function useUltraFastAnimation<T extends Record<string, number>>(
  initialValues: T,
  config?: Partial<typeof ANIMATION_CONFIG>
) {
  const configRef = useRef({ ...ANIMATION_CONFIG, ...config });
  
  // Criar shared values
  const values = useMemo(() => {
    const result: Record<keyof T, SharedValue<number>> = {} as Record<keyof T, SharedValue<number>>;
    for (const [key, value] of Object.entries(initialValues)) {
      result[key as keyof T] = useSharedValue(value);
    }
    return result;
  }, [initialValues]);

  // Animação com timing otimizado
  const animateTo = useCallback((
    key: keyof T,
    toValue: number,
    duration?: number,
    easing?: (t: number) => number
  ) => {
    const sharedValue = values[key];
    if (!sharedValue) return;
    
    const animDuration = duration ?? configRef.current.DURATIONS.NORMAL;
    const animEasing = easing ?? configRef.current.EASING.EASE_OUT;
    
    sharedValue.value = withTiming(toValue, {
      duration: animDuration,
      easing: animEasing,
      reduceMotion: configRef.current.PERFORMANCE.REDUCE_MOTION,
    });
  }, [values]);

  // Animação com spring
  const animateSpring = useCallback((
    key: keyof T,
    toValue: number,
    springConfig?: Partial<typeof ANIMATION_CONFIG.SPRING>
  ) => {
    const sharedValue = values[key];
    if (!sharedValue) return;
    
    const spring = { ...configRef.current.SPRING, ...springConfig };
    
    sharedValue.value = withSpring(toValue, {
      damping: spring.DAMPING,
      stiffness: spring.STIFFNESS,
      mass: spring.MASS,
      velocity: spring.VELOCITY,
      reduceMotion: configRef.current.PERFORMANCE.REDUCE_MOTION,
    });
  }, [values]);

  // Animação sequencial
  const animateSequence = useCallback((
    key: keyof T,
    sequence: Array<{ value: number; duration?: number; type?: 'timing' | 'spring' }>
  ) => {
    const sharedValue = values[key];
    if (!sharedValue) return;
    
    const animations = sequence.map(({ value, duration, type }) => {
      const animDuration = duration ?? configRef.current.DURATIONS.NORMAL;
      
      if (type === 'spring') {
        return withSpring(value, {
          damping: configRef.current.SPRING.DAMPING,
          stiffness: configRef.current.SPRING.STIFFNESS,
          mass: configRef.current.SPRING.MASS,
          reduceMotion: configRef.current.PERFORMANCE.REDUCE_MOTION,
        });
      } else {
        return withTiming(value, {
          duration: animDuration,
          easing: configRef.current.EASING.EASE_OUT,
          reduceMotion: configRef.current.PERFORMANCE.REDUCE_MOTION,
        });
      }
    });
    
    sharedValue.value = withSequence(...animations);
  }, [values]);

  // Reset animation
  const reset = useCallback((key?: keyof T) => {
    if (key) {
      const sharedValue = values[key];
      const initialValue = initialValues[key];
      if (sharedValue && initialValue !== undefined) {
        sharedValue.value = initialValue;
      }
    } else {
      for (const [animKey, initialValue] of Object.entries(initialValues)) {
        const sharedValue = values[animKey as keyof T];
        if (sharedValue && initialValue !== undefined) {
          sharedValue.value = initialValue;
        }
      }
    }
  }, [values, initialValues]);

  // Cancel animation
  const cancel = useCallback((key?: keyof T) => {
    if (key) {
      const sharedValue = values[key];
      if (sharedValue) {
        cancelAnimation(sharedValue);
      }
    } else {
      for (const sharedValue of Object.values(values)) {
        cancelAnimation(sharedValue);
      }
    }
  }, [values]);

  return {
    values,
    animateTo,
    animateSpring,
    animateSequence,
    reset,
    cancel,
  };
}

// Hook para transições de tela ultra rápidas
export function useScreenTransition(
  isVisible: boolean,
  animationType: 'fade' | 'slide' | 'scale' | 'flip' = 'fade',
  direction: 'up' | 'down' | 'left' | 'right' = 'up'
) {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(isVisible ? 1 : 0.8);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Show animation
      switch (animationType) {
        case 'fade':
          opacity.value = withTiming(1, {
            duration: ANIMATION_CONFIG.DURATIONS.FAST,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
          });
          break;
          
        case 'slide':
          opacity.value = withTiming(1, {
            duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
          });
          
          const slideOffset = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
          translateX.value = withTiming(0, {
            duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
          });
          break;
          
        case 'scale':
          opacity.value = withTiming(1, {
            duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
            easing: ANIMATION_CONFIG.EASING.BOUNCE,
          });
          scale.value = withTiming(1, {
            duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
          });
          break;
          
        case 'flip':
          scale.value = withSequence(
            withTiming(0.8, { duration: ANIMATION_CONFIG.DURATIONS.FAST }),
            withTiming(1.1, { duration: ANIMATION_CONFIG.DURATIONS.FAST }),
            withTiming(1, { duration: ANIMATION_CONFIG.DURATIONS.FAST })
          );
          opacity.value = withTiming(1, {
            duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
            easing: ANIMATION_CONFIG.EASING.EASE_OUT,
          });
          break;
      }
    } else {
      // Hide animation
      opacity.value = withTiming(0, {
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
      });
      
      if (animationType === 'slide' && direction === 'left') {
        translateX.value = withTiming(-50, {
          duration: ANIMATION_CONFIG.DURATIONS.FAST,
          easing: ANIMATION_CONFIG.EASING.EASE_IN,
        });
      }
    }
  }, [isVisible, animationType, direction]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value } as any,
      { translateX: translateX.value } as any,
      { translateY: translateY.value } as any,
    ],
  }));

  return animatedStyle;
}

// Hook para gestos otimizados
export function useOptimizedGestures(
  onPan?: (translationX: number, translationY: number) => void,
  onTap?: () => void,
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void
) {
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      startX.value = 0;
      startY.value = 0;
    })
    .onUpdate((event) => {
      startX.value = event.translationX;
      startY.value = event.translationY;
      
      if (onPan) {
        runOnJS(onPan)(event.translationX, event.translationY);
      }
    })
    .onEnd((event) => {
      isActive.value = false;
      
      // Detect swipe
      if (onSwipe) {
        const { translationX, translationY } = event;
        const threshold = 50;
        
        if (Math.abs(translationX) > Math.abs(translationY)) {
          if (translationX > threshold) {
            runOnJS(onSwipe)('right');
          } else if (translationX < -threshold) {
            runOnJS(onSwipe)('left');
          }
        } else {
          if (translationY > threshold) {
            runOnJS(onSwipe)('down');
          } else if (translationY < -threshold) {
            runOnJS(onSwipe)('up');
          }
        }
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (onTap) {
        runOnJS(onTap)();
      }
    });

  const gesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX.value } as any,
      { translateY: startY.value } as any,
    ],
  }));

  return {
    gesture,
    animatedStyle,
    isActive,
  };
}

// Hook para animações de loading ultra rápidas
export function useUltraFastLoading(
  isLoading: boolean,
  size: 'small' | 'medium' | 'large' = 'medium'
) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const sizeConfig = useMemo(() => ({
    small: { scale: 0.8, duration: 800 },
    medium: { scale: 1, duration: 1000 },
    large: { scale: 1.2, duration: 1200 },
  }), [size]);

  useEffect(() => {
    if (isLoading) {
      // Start loading animation
      opacity.value = withTiming(1, {
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_OUT,
      });
      
      scale.value = withTiming(sizeConfig[size].scale, {
        duration: ANIMATION_CONFIG.DURATIONS.NORMAL,
        easing: ANIMATION_CONFIG.EASING.BOUNCE,
      });
      
      rotation.value = withRepeat(
        withTiming(360, {
          duration: sizeConfig[size].duration,
          easing: ANIMATION_CONFIG.EASING.EASE_IN_OUT,
        }),
        -1,
        false
      );
    } else {
      // Stop loading animation
      cancelAnimation(rotation);
      
      opacity.value = withTiming(0, {
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
      });
      
      scale.value = withTiming(0.8, {
        duration: ANIMATION_CONFIG.DURATIONS.FAST,
        easing: ANIMATION_CONFIG.EASING.EASE_IN,
      });
    }
  }, [isLoading, size, sizeConfig]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotation.value}deg` } as any,
      { scale: scale.value } as any,
    ],
  }));

  return animatedStyle;
}

// Hook para animações de feedback tátil
export function useHapticFeedback() {
  const triggerFeedback = useCallback((
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
  ) => {
    // Implementar feedback tátil baseado no tipo
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Web vibration API
      const patterns = {
        light: [10],
        medium: [50],
        heavy: [100],
        success: [10, 50, 10],
        warning: [50, 30, 50],
        error: [100, 50, 100],
      };
      
      if ('vibrate' in navigator) {
        navigator.vibrate(patterns[type]);
      }
    } else {
      // Native haptic feedback (implementar com expo-haptics)
      console.log(`Haptic feedback: ${type}`);
    }
  }, []);

  return { triggerFeedback };
}

// Componente de animação otimizado
export const UltraFastAnimatedView = Animated.createAnimatedComponent(View);

// Utilitários de animação
export const animationUtils = {
  // Criar animação de entrada
  createEnterAnimation: (type: 'fade' | 'slide' | 'scale' = 'fade') => {
    const configs = {
      fade: { opacity: 0, to: { opacity: 1 } },
      slide: { translateX: -100, to: { translateX: 0 } },
      scale: { scale: 0.8, to: { scale: 1 } },
    };
    
    return configs[type];
  },
  
  // Criar animação de saída
  createExitAnimation: (type: 'fade' | 'slide' | 'scale' = 'fade') => {
    const configs = {
      fade: { opacity: 1, to: { opacity: 0 } },
      slide: { translateX: 0, to: { translateX: 100 } },
      scale: { scale: 1, to: { scale: 0.8 } },
    };
    
    return configs[type];
  },
  
  // Interpolar valores
  interpolate: (
    value: SharedValue<number>,
    inputRange: number[],
    outputRange: number[],
    extrapolate?: Extrapolation.CLAMP | Extrapolation.EXTEND | Extrapolation.IDENTITY
  ) => {
    return interpolate(value.value, inputRange, outputRange, extrapolate);
  },
  
  // Animar com delay
  animateWithDelay: (
    delay: number,
    animation: () => any
  ) => {
    return withDelay(delay, animation());
  },
};

export default {
  ANIMATION_CONFIG,
  useUltraFastAnimation,
  useScreenTransition,
  useOptimizedGestures,
  useUltraFastLoading,
  useHapticFeedback,
  UltraFastAnimatedView,
  animationUtils,
};
