import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
  cancelAnimation,
  Easing,
  ReduceMotion,
} from "react-native-reanimated";
import { Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Configurações de animação predefinidas
export const ANIMATION_CONFIGS = {
  // Spring configs
  SPRING_GENTLE: {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  SPRING_SNAPPY: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  SPRING_BOUNCY: {
    damping: 5,
    stiffness: 300,
    mass: 1,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
  SPRING_RIGID: {
    damping: 20,
    stiffness: 500,
    mass: 1,
    overshootClamping: true,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },

  // Timing configs
  TIMING_GENTLE: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  },
  TIMING_SNAPPY: {
    duration: 200,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  },
  TIMING_SMOOTH: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  TIMING_DRAMATIC: {
    duration: 800,
    easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  },
  TIMING_LINEAR: {
    duration: 300,
    easing: Easing.linear,
  },
};

// Tipos de animação
export type AnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideIn"
  | "slideOut"
  | "scaleIn"
  | "scaleOut"
  | "rotate"
  | "bounce"
  | "pulse"
  | "shake"
  | "flip"
  | "elastic"
  | "wave"
  | "glow"
  | "parallax"
  | "dramatic"
  | "snappy"
  | "smooth";

export type AnimationDirection = "up" | "down" | "left" | "right";

export interface AnimationConfig {
  type: AnimationType;
  direction?: AnimationDirection;
  duration?: number;
  delay?: number;
  repeat?: number;
  autoReverse?: boolean;
  spring?: boolean;
  config?: any;
}

// Hook principal para animações avançadas
export function useAdvancedAnimation(config: AnimationConfig) {
  const {
    type,
    direction = "up",
    duration = 300,
    delay = 0,
    repeat = 1,
    autoReverse = false,
    spring = false,
    config: customConfig,
  } = config;

  const progress = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const getAnimationConfig = () => {
    if (customConfig) return customConfig;

    if (spring) {
      switch (type) {
        case "bounce":
          return ANIMATION_CONFIGS.SPRING_BOUNCY;
        case "pulse":
        case "elastic":
          return ANIMATION_CONFIGS.SPRING_SNAPPY;
        default:
          return ANIMATION_CONFIGS.SPRING_GENTLE;
      }
    } else {
      switch (type) {
        case "dramatic":
          return ANIMATION_CONFIGS.TIMING_DRAMATIC;
        case "snappy":
          return ANIMATION_CONFIGS.TIMING_SNAPPY;
        case "smooth":
          return ANIMATION_CONFIGS.TIMING_SMOOTH;
        default:
          return ANIMATION_CONFIGS.TIMING_GENTLE;
      }
    }
  };

  const startAnimation = (callback?: () => void) => {
    if (isAnimating.value) return;

    isAnimating.value = true;
    const animationConfig = getAnimationConfig();
    const animationValue = spring
      ? withSpring(1, animationConfig)
      : withTiming(1, animationConfig);

    const finalAnimation =
      delay > 0 ? withDelay(delay, animationValue) : animationValue;

    const repeatedAnimation =
      repeat > 1
        ? withRepeat(finalAnimation, repeat, autoReverse)
        : finalAnimation;

    progress.value = repeatedAnimation;

    if (callback) {
      progress.value = withTiming(1, animationConfig, (finished) => {
        if (finished) {
          runOnJS(callback)();
          isAnimating.value = false;
        }
      });
    }
  };

  const stopAnimation = () => {
    cancelAnimation(progress);
    isAnimating.value = false;
  };

  const resetAnimation = () => {
    stopAnimation();
    progress.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => {
    const value = progress.value;

    switch (type) {
      case "fadeIn":
        return {
          opacity: value,
        };

      case "fadeOut":
        return {
          opacity: 1 - value,
        };

      case "slideIn":
        const slideDistance = screenWidth * 0.3;
        let translateX = 0;
        let translateY = 0;

        switch (direction) {
          case "left":
            translateX = interpolate(value, [0, 1], [-slideDistance, 0]);
            break;
          case "right":
            translateX = interpolate(value, [0, 1], [slideDistance, 0]);
            break;
          case "up":
            translateY = interpolate(value, [0, 1], [-slideDistance, 0]);
            break;
          case "down":
            translateY = interpolate(value, [0, 1], [slideDistance, 0]);
            break;
        }

        return {
          transform: [{ translateX }, { translateY }],
          opacity: value,
        };

      case "slideOut":
        const outSlideDistance = screenWidth * 0.3;
        let outTranslateX = 0;
        let outTranslateY = 0;

        switch (direction) {
          case "left":
            outTranslateX = interpolate(value, [0, 1], [0, -outSlideDistance]);
            break;
          case "right":
            outTranslateX = interpolate(value, [0, 1], [0, outSlideDistance]);
            break;
          case "up":
            outTranslateY = interpolate(value, [0, 1], [0, -outSlideDistance]);
            break;
          case "down":
            outTranslateY = interpolate(value, [0, 1], [0, outSlideDistance]);
            break;
        }

        return {
          transform: [
            { translateX: outTranslateX },
            { translateY: outTranslateY },
          ],
          opacity: 1 - value,
        };

      case "scaleIn":
        return {
          transform: [
            {
              scale: interpolate(value, [0, 1], [0.8, 1], Extrapolate.CLAMP),
            },
          ],
          opacity: value,
        };

      case "scaleOut":
        return {
          transform: [
            {
              scale: interpolate(value, [0, 1], [1, 0.8], Extrapolate.CLAMP),
            },
          ],
          opacity: 1 - value,
        };

      case "rotate":
        return {
          transform: [
            {
              rotate: `${interpolate(value, [0, 1], [0, Math.PI * 2])}rad`,
            },
          ],
        };

      case "bounce":
        return {
          transform: [
            {
              translateY: interpolate(
                value,
                [0, 0.2, 0.4, 0.6, 0.8, 1],
                [0, -30, 0, -15, 0, 0],
                Extrapolate.CLAMP,
              ),
            },
          ],
        };

      case "pulse":
        return {
          transform: [
            {
              scale: interpolate(
                value,
                [0, 0.5, 1],
                [1, 1.05, 1],
                Extrapolate.CLAMP,
              ),
            },
          ],
        };

      case "shake":
        return {
          transform: [
            {
              translateX: interpolate(
                value,
                [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                [0, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
                Extrapolate.CLAMP,
              ),
            },
          ],
        };

      case "flip":
        return {
          transform: [
            {
              rotateY: `${interpolate(value, [0, 1], [0, Math.PI])}rad`,
            },
          ],
        };

      case "elastic":
        return {
          transform: [
            {
              scaleX: interpolate(
                value,
                [0, 0.2, 0.4, 0.6, 0.8, 1],
                [1, 1.3, 0.9, 1.1, 0.95, 1],
                Extrapolate.CLAMP,
              ),
            },
          ],
        };

      case "wave":
        return {
          transform: [
            {
              translateY: interpolate(
                value,
                [0, 0.25, 0.5, 0.75, 1],
                [0, -20, 0, 20, 0],
                Extrapolate.CLAMP,
              ),
            },
            {
              rotate: `${interpolate(value, [0, 0.25, 0.5, 0.75, 1], [0, -Math.PI / 36, 0, Math.PI / 36, 0], Extrapolate.CLAMP)}rad`,
            },
          ],
        };

      case "glow":
        return {
          shadowOpacity: interpolate(value, [0, 1], [0, 0.8]),
          shadowRadius: interpolate(value, [0, 1], [0, 20]),
          shadowOffset: {
            width: 0,
            height: interpolate(value, [0, 1], [0, 10]),
          },
        };

      case "parallax":
        return {
          transform: [
            {
              translateX: interpolate(
                value,
                [0, 1],
                [screenWidth * 0.1, -screenWidth * 0.1],
              ),
            },
            {
              scale: interpolate(value, [0, 1], [1, 1.1]),
            },
          ],
          opacity: interpolate(value, [0, 0.5, 1], [0.8, 1, 0.8]),
        };

      default:
        return {};
    }
  });

  return {
    animatedStyle,
    startAnimation,
    stopAnimation,
    resetAnimation,
    isAnimating: isAnimating.value,
    progress: progress.value,
  };
}

// Animações compostas
export function useStaggeredAnimation(
  configs: AnimationConfig[],
  staggerDelay: number = 100,
) {
  const animations = configs.map((config) => useAdvancedAnimation(config));

  const startAll = () => {
    animations.forEach((animation, index) => {
      setTimeout(() => {
        animation.startAnimation();
      }, index * staggerDelay);
    });
  };

  const stopAll = () => {
    animations.forEach((animation) => animation.stopAnimation());
  };

  const resetAll = () => {
    animations.forEach((animation) => animation.resetAnimation());
  };

  return {
    animations,
    startAll,
    stopAll,
    resetAll,
  };
}

// Animações de entrada/saída para telas
export function useScreenTransition(
  type: "slide" | "fade" | "scale" | "flip" = "slide",
) {
  const progress = useSharedValue(0);

  const enter = () => {
    progress.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  };

  const exit = () => {
    progress.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.55, 0.085, 0.68, 0.53),
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const value = progress.value;

    switch (type) {
      case "slide":
        return {
          transform: [
            {
              translateX: interpolate(value, [0, 1], [screenWidth, 0]),
            },
          ],
        };

      case "fade":
        return {
          opacity: value,
        };

      case "scale":
        return {
          transform: [
            {
              scale: interpolate(value, [0, 1], [0.9, 1]),
            },
          ],
          opacity: value,
        };

      case "flip":
        return {
          transform: [
            {
              rotateY: `${interpolate(value, [0, 1], [0, Math.PI])}rad`,
            },
          ],
          opacity: value,
        };

      default:
        return {};
    }
  });

  return {
    animatedStyle,
    enter,
    exit,
    progress,
  };
}

// Animações de loading
export function useLoadingAnimation() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const start = () => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, {
          duration: 500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
        withTiming(1, {
          duration: 500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
      ),
      -1,
      true,
    );
  };

  const stop = () => {
    cancelAnimation(rotation);
    cancelAnimation(scale);
    rotation.value = 0;
    scale.value = 1;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return {
    animatedStyle,
    start,
    stop,
  };
}

// Animações de gestos
export function useGestureAnimation() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.95, ANIMATION_CONFIGS.SPRING_SNAPPY);
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, ANIMATION_CONFIGS.SPRING_SNAPPY);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
}
