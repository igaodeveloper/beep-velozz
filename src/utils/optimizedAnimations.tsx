// src/utils/optimizedAnimations.ts
/**
 * Optimized Animations - 60fps Performance
 * Sistema de animações otimizado sem dependências complexas
 */

import * as React from 'react';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Animated, View } from 'react-native';

// Configurações de animação otimizadas
export const ANIMATION_CONFIG = {
  DURATIONS: {
    INSTANT: 0,
    FAST: 120,
    NORMAL: 200,
    SLOW: 300,
  },
  
  EASING: {
    EASE_IN: 'easeIn',
    EASE_OUT: 'easeOut',
    EASE_IN_OUT: 'easeInOut',
  },
  
  SPRING: {
    tension: 100,
    friction: 8,
  },
};

// Hook para animações básicas
export function useOptimizedAnimation(initialValue: number = 0) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  
  const animateTo = useCallback((toValue: number, duration?: number) => {
    return Animated.timing(animatedValue, {
      toValue,
      duration: duration || ANIMATION_CONFIG.DURATIONS.NORMAL,
      useNativeDriver: true,
    });
  }, [animatedValue]);
  
  const animateSpring = useCallback((toValue: number) => {
    return Animated.spring(animatedValue, {
      toValue,
      ...ANIMATION_CONFIG.SPRING,
      useNativeDriver: true,
    });
  }, [animatedValue]);
  
  const animateSequence = useCallback((animations: Animated.CompositeAnimation[]) => {
    return Animated.sequence(animations);
  }, []);
  
  const animateParallel = useCallback((animations: Animated.CompositeAnimation[]) => {
    return Animated.parallel(animations);
  }, []);
  
  return {
    value: animatedValue,
    animateTo,
    animateSpring,
    animateSequence,
    animateParallel,
  };
}

// Hook para animações de fade
export function useFadeAnimation(isVisible: boolean) {
  const { value, animateTo } = useOptimizedAnimation(isVisible ? 1 : 0);
  
  useEffect(() => {
    const animation = animateTo(isVisible ? 1 : 0, ANIMATION_CONFIG.DURATIONS.FAST);
    animation.start();
    
    return () => animation.stop();
  }, [isVisible, animateTo]);
  
  return value;
}

// Hook para animações de slide
export function useSlideAnimation(isVisible: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'left') {
  const initialValue = isVisible ? 0 : (direction === 'left' ? -100 : 100);
  const { value, animateTo } = useOptimizedAnimation(initialValue);
  
  useEffect(() => {
    const targetValue = isVisible ? 0 : (direction === 'left' ? -100 : 100);
    const animation = animateTo(targetValue, ANIMATION_CONFIG.DURATIONS.NORMAL);
    animation.start();
    
    return () => animation.stop();
  }, [isVisible, direction, animateTo]);
  
  return value;
}

// Hook para animações de scale
export function useScaleAnimation(isVisible: boolean) {
  const { value, animateTo } = useOptimizedAnimation(isVisible ? 1 : 0.8);
  
  useEffect(() => {
    const animation = animateTo(isVisible ? 1 : 0.8, ANIMATION_CONFIG.DURATIONS.NORMAL);
    animation.start();
    
    return () => animation.stop();
  }, [isVisible, animateTo]);
  
  return value;
}

// Hook para animações de rotação (loading)
export function useRotationAnimation(isLoading: boolean) {
  const { value, animateTo } = useOptimizedAnimation(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    if (isLoading) {
      animationRef.current = Animated.loop(
        Animated.timing(value, {
          toValue: 360,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      value.setValue(0);
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isLoading, value]);
  
  return value;
}

// Hook combinado para transições de tela
export function useScreenTransition(
  isVisible: boolean,
  type: 'fade' | 'slide' | 'scale' = 'fade',
  direction: 'left' | 'right' | 'up' | 'down' = 'left'
) {
  const opacity = useFadeAnimation(isVisible);
  const translateX = useSlideAnimation(isVisible, direction === 'left' || direction === 'right' ? direction : 'left');
  const translateY = useSlideAnimation(isVisible, direction === 'up' || direction === 'down' ? direction : 'up');
  const scale = useScaleAnimation(isVisible);
  
  const animatedStyle = useMemo(() => ({
    opacity,
    transform: [
      { translateX },
      { translateY },
      { scale },
    ],
  }), [opacity, translateX, translateY, scale]);
  
  return animatedStyle;
}

// Componente otimizado com animação
interface AnimatedViewProps {
  children: React.ReactNode;
  style?: any;
  isVisible?: boolean;
  animationType?: 'fade' | 'slide' | 'scale';
}

export const AnimatedView = ({
  children,
  style,
  isVisible = true,
  animationType = 'fade',
  ...props
}: AnimatedViewProps) => {
  const animatedStyle = useScreenTransition(isVisible, animationType);
  
  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};

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
  
  // Animação de shake para erros
  shake: (value: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(value, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]);
  },
  
  // Animação de pulse para feedback
  pulse: (value: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
  },
  
  // Animação de bounce para sucesso
  bounce: (value: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(value, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.spring(value, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(value, { toValue: 1, useNativeDriver: true }),
    ]);
  },
};

export default {
  ANIMATION_CONFIG,
  useOptimizedAnimation,
  useFadeAnimation,
  useSlideAnimation,
  useScaleAnimation,
  useRotationAnimation,
  useScreenTransition,
  AnimatedView,
  animationUtils,
};
