import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Configurações de animação
export const ANIMATION_PRESETS = {
  spring: {
    damping: 15,
    stiffness: 200,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  timing: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  },
  bouncy: {
    damping: 5,
    stiffness: 400,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  snappy: {
    duration: 200,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  },
};

// Hook para animações básicas
export function useBasicAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}rad` },
    ],
    opacity: opacity.value,
  }));

  const pressIn = () => {
    scale.value = withSpring(0.95, ANIMATION_PRESETS.spring);
    opacity.value = withTiming(0.8, ANIMATION_PRESETS.snappy);
  };

  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_PRESETS.spring);
    opacity.value = withTiming(1, ANIMATION_PRESETS.snappy);
  };

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, ANIMATION_PRESETS.snappy),
      withTiming(10, ANIMATION_PRESETS.snappy),
      withTiming(-10, ANIMATION_PRESETS.snappy),
      withTiming(10, ANIMATION_PRESETS.snappy),
      withTiming(0, ANIMATION_PRESETS.snappy)
    );
  };

  const bounce = () => {
    translateY.value = withSequence(
      withSpring(-20, ANIMATION_PRESETS.bouncy),
      withSpring(0, ANIMATION_PRESETS.bouncy)
    );
  };

  const pulse = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, ANIMATION_PRESETS.timing),
        withTiming(1, ANIMATION_PRESETS.timing)
      ),
      3,
      true
    );
  };

  const rotate360 = () => {
    rotate.value = withTiming(Math.PI * 2, ANIMATION_PRESETS.timing);
  };

  return {
    animatedStyle,
    pressIn,
    pressOut,
    shake,
    bounce,
    pulse,
    rotate360,
    scale,
    opacity,
    translateY,
    translateX,
    rotate,
  };
}

// Hook para transições de tela
export function useScreenTransition() {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [50, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.9, 1]);

    return {
      transform: [
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  const enter = () => {
    progress.value = withTiming(1, ANIMATION_PRESETS.timing);
  };

  const exit = () => {
    progress.value = withTiming(0, ANIMATION_PRESETS.timing);
  };

  return {
    animatedStyle,
    enter,
    exit,
    progress,
  };
}

// Hook para loading indicators
export function useLoadingAnimation() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const start = () => {
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, ANIMATION_PRESETS.snappy),
        withTiming(1, ANIMATION_PRESETS.snappy)
      ),
      -1,
      true
    );
  };

  const stop = () => {
    cancelAnimation(rotation);
    cancelAnimation(scale);
    rotation.value = 0;
    scale.value = 1;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}rad` },
      { scale: scale.value },
    ],
  }));

  return {
    animatedStyle,
    start,
    stop,
  };
}

// Hook para animações de tab
export function useTabAnimation(isActive: boolean = false) {
  const scale = useSharedValue(isActive ? 1.1 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.6);
  const translateY = useSharedValue(isActive ? -4 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const activate = () => {
    scale.value = withSpring(1.1, ANIMATION_PRESETS.spring);
    opacity.value = withTiming(1, ANIMATION_PRESETS.snappy);
    translateY.value = withTiming(-4, ANIMATION_PRESETS.snappy);
  };

  const deactivate = () => {
    scale.value = withSpring(1, ANIMATION_PRESETS.spring);
    opacity.value = withTiming(0.6, ANIMATION_PRESETS.snappy);
    translateY.value = withTiming(0, ANIMATION_PRESETS.snappy);
  };

  return {
    animatedStyle,
    activate,
    deactivate,
  };
}

// Hook para animações de cards
export function useCardAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const elevation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    shadowOpacity: elevation.value,
    shadowRadius: elevation.value * 10,
    shadowOffset: {
      width: 0,
      height: elevation.value * 5,
    },
  }));

  const pressIn = () => {
    scale.value = withSpring(0.98, ANIMATION_PRESETS.spring);
    elevation.value = withTiming(0.3, ANIMATION_PRESETS.snappy);
  };

  const pressOut = () => {
    scale.value = withSpring(1, ANIMATION_PRESETS.spring);
    elevation.value = withTiming(0, ANIMATION_PRESETS.snappy);
  };

  const highlight = () => {
    elevation.value = withTiming(0.2, ANIMATION_PRESETS.timing);
  };

  const unhighlight = () => {
    elevation.value = withTiming(0, ANIMATION_PRESETS.timing);
  };

  return {
    animatedStyle,
    pressIn,
    pressOut,
    highlight,
    unhighlight,
  };
}

// Hook para animações de lista
export function useListItemAnimation(index: number, delay: number = 50) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [30, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.9, 1]);

    return {
      transform: [
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  const enter = () => {
    progress.value = withDelay(
      index * delay,
      withTiming(1, ANIMATION_PRESETS.timing)
    );
  };

  return {
    animatedStyle,
    enter,
  };
}

// Hook para animações de modais
export function useModalAnimation(isVisible: boolean) {
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const show = () => {
    backdropOpacity.value = withTiming(0.5, ANIMATION_PRESETS.timing);
    modalScale.value = withSpring(1, ANIMATION_PRESETS.spring);
    modalOpacity.value = withTiming(1, ANIMATION_PRESETS.timing);
  };

  const hide = () => {
    backdropOpacity.value = withTiming(0, ANIMATION_PRESETS.timing);
    modalScale.value = withSpring(0.8, ANIMATION_PRESETS.spring);
    modalOpacity.value = withTiming(0, ANIMATION_PRESETS.timing);
  };

  React.useEffect(() => {
    if (isVisible) {
      show();
    } else {
      hide();
    }
  }, [isVisible]);

  return {
    backdropStyle,
    modalStyle,
    show,
    hide,
  };
}

// Funções utilitárias
export const createStaggeredAnimation = (
  items: any[],
  animation: (item: any, index: number) => void,
  delay: number = 100
) => {
  items.forEach((item, index) => {
    setTimeout(() => {
      animation(item, index);
    }, index * delay);
  });
};

export const createSequentialAnimation = (
  animations: (() => void)[],
  delay: number = 200
) => {
  animations.forEach((animation, index) => {
    setTimeout(() => {
      animation();
    }, index * delay);
  });
};

export const createParallelAnimation = (animations: (() => void)[]) => {
  animations.forEach(animation => animation());
};
