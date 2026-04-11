import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Easing as ReEasing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface ScreenTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  animationType?: "slide" | "fade" | "scale" | "flip" | "bounce" | "glide";
  direction?: "left" | "right" | "up" | "down";
  duration?: number;
  onAnimationComplete?: () => void;
}

// Ultra-fast configuration for maximum performance
const ULTRA_FAST_CONFIG = {
  duration: 200, // Reduzido de 500ms para 200ms
  fps: 120, // Máximo FPS possível
  hz: 120, // Máximo HZ para atualizações
  easing: "out" as const, // Easing mais rápido
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ScreenTransition({
  children,
  isVisible,
  animationType = "slide",
  direction = "left",
  duration = ULTRA_FAST_CONFIG.duration, // Usar configuração ultra-rápida
  onAnimationComplete,
}: ScreenTransitionProps) {
  // Animation values
  const progress = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Start animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      // Show animation - ultra-fast with maximum performance
      progress.value = withSequence(
        withTiming(1, {
          duration: Math.floor(duration * 0.6), // 60% do tempo original
          easing: ReEasing.out(ReEasing.ease), // Easing mais rápido
        }),
        withTiming(1, { duration: 0 }),
      );

      scale.value = withSpring(1, {
        damping: 25, // Aumentado para menos oscilação
        stiffness: 200, // Aumentado para resposta mais rápida
        mass: 0.5, // Reduzido para menor inércia
      });

      rotation.value = withTiming(0, {
        duration: Math.floor(duration * 0.4), // 40% do tempo
        easing: ReEasing.out(ReEasing.ease),
      });

      opacity.value = withTiming(1, {
        duration: Math.floor(duration * 0.3), // 30% do tempo
        easing: ReEasing.out(ReEasing.ease),
      });
    } else {
      // Hide animation - ainda mais rápido
      progress.value = withTiming(0, {
        duration: Math.floor(duration * 0.3), // 30% do tempo
        easing: ReEasing.in(ReEasing.ease),
      });

      scale.value = withTiming(0.9, {
        duration: Math.floor(duration * 0.2), // 20% do tempo
        easing: ReEasing.in(ReEasing.ease),
      });

      opacity.value = withTiming(0, {
        duration: Math.floor(duration * 0.15), // 15% do tempo
        easing: ReEasing.in(ReEasing.ease),
      });
    }
  }, [isVisible, duration]);

  // Handle animation completion
  useEffect(() => {
    if (progress.value === 1 && isVisible) {
      onAnimationComplete?.();
    }
  }, [progress.value, isVisible, onAnimationComplete]);

  // Calculate initial and final positions based on direction
  const getAnimationValues = () => {
    switch (animationType) {
      case "slide":
        switch (direction) {
          case "left":
            return { from: -screenWidth, to: 0 };
          case "right":
            return { from: screenWidth, to: 0 };
          case "up":
            return { from: -screenHeight, to: 0 };
          case "down":
            return { from: screenHeight, to: 0 };
          default:
            return { from: -screenWidth, to: 0 };
        }
      case "scale":
        return { from: 0.5, to: 1 };
      case "flip":
        return { from: 90, to: 0 };
      case "bounce":
        return { from: -50, to: 0 };
      case "glide":
        return { from: -100, to: 0 };
      default:
        return { from: -screenWidth, to: 0 };
    }
  };

  const animationValues = getAnimationValues();

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const animProgress = progress.value;

    switch (animationType) {
      case "slide":
        const translateValue = interpolate(
          animProgress,
          [0, 1],
          [animationValues.from, animationValues.to],
        );

        if (direction === "left" || direction === "right") {
          return {
            transform: [{ translateX: translateValue }],
            opacity: opacity.value,
          };
        } else {
          return {
            transform: [{ translateY: translateValue }],
            opacity: opacity.value,
          };
        }

      case "fade":
        return {
          opacity: opacity.value,
        };

      case "scale":
        const scaleValue = interpolate(
          animProgress,
          [0, 1],
          [animationValues.from, animationValues.to],
        );
        return {
          transform: [{ scale: scaleValue }],
          opacity: opacity.value,
        };

      case "flip":
        const rotationValue = interpolate(
          animProgress,
          [0, 1],
          [animationValues.from, animationValues.to],
        );
        return {
          transform: [{ rotateY: `${rotationValue}deg` }],
          opacity: opacity.value,
        };

      case "bounce":
        const bounceValue = interpolate(
          animProgress,
          [0, 0.3, 0.6, 0.8, 1], // Keyframes mais rápidos
          [
            animationValues.from,
            animationValues.to * 1.05,
            animationValues.to * 0.98,
            animationValues.to,
            animationValues.to,
          ],
        );
        return {
          transform: [{ translateY: bounceValue }],
          opacity: opacity.value,
        };

      case "glide":
        const glideValue = interpolate(
          animProgress,
          [0, 1],
          [animationValues.from, animationValues.to],
        );
        const glideScale = interpolate(
          animProgress,
          [0, 0.4, 1], // Keyframes mais rápidos
          [0.9, 1.02, 1], // Menor amplitude
        );
        return {
          transform: [{ translateX: glideValue }, { scale: glideScale }],
          opacity: opacity.value,
        };

      default:
        return {
          opacity: opacity.value,
        };
    }
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});

// Export animation types for easy use
export const ANIMATION_TYPES = {
  SLIDE: "slide",
  FADE: "fade",
  SCALE: "scale",
  FLIP: "flip",
  BOUNCE: "bounce",
  GLIDE: "glide",
} as const;

export const DIRECTIONS = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down",
} as const;
