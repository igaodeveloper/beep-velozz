import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import * as Haptics from "expo-haptics";

export type IconVariant = "solid" | "outline" | "duotone" | "light";
export type IconAnimation =
  | "none"
  | "pulse"
  | "bounce"
  | "rotate"
  | "shake"
  | "fade"
  | "scale";
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface ModernIconProps {
  icon: React.ReactNode;
  size?: IconSize;
  color?: string;
  variant?: IconVariant;
  animation?: IconAnimation;
  animated?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
  containerStyle?: any;
  disabled?: boolean;
}

export default function ModernIcon({
  icon,
  size = "md",
  color,
  variant = "solid",
  animation = "none",
  animated = true,
  onPress,
  onLongPress,
  hapticFeedback = true,
  containerStyle,
  disabled = false,
}: ModernIconProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;

  const iconColor = color || colors.text;

  const getIconSize = (sizeType: IconSize): number => {
    const sizeMap = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      "2xl": 32,
    };
    return sizeMap[sizeType];
  };

  const iconSize = getIconSize(size);

  useEffect(() => {
    if (!animated || disabled) return;

    switch (animation) {
      case "pulse":
        startPulseAnimation();
        break;
      case "bounce":
        startBounceAnimation();
        break;
      case "rotate":
        startRotateAnimation();
        break;
      case "shake":
        startShakeAnimation();
        break;
      case "fade":
        startFadeAnimation();
        break;
      case "scale":
        startScaleAnimation();
        break;
      default:
        break;
    }
  }, [animation, animated, disabled]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ).start();
  };

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateXAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startFadeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const startScaleAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const handlePressIn = () => {
    if (disabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.spring(scaleAnim, {
      toValue: 0.9,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "outline":
        return {
          borderWidth: 2,
          borderColor: iconColor,
          borderRadius: iconSize / 2,
        };
      case "duotone":
        return {
          backgroundColor: iconColor + "20",
          borderRadius: iconSize / 2,
        };
      case "light":
        return {
          opacity: 0.6,
        };
      default:
        return {};
    }
  };

  const animatedStyle = animated
    ? {
        transform: [
          { scale: scaleAnim },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
          { translateX: translateXAnim },
        ],
        opacity: opacityAnim,
      }
    : {};

  const IconComponent = React.cloneElement(icon as React.ReactElement<any>, {
    width: iconSize,
    height: iconSize,
    color: iconColor,
    style: [{ opacity: disabled ? 0.5 : 1 }, getVariantStyle()],
  });

  if (!onPress && !onLongPress) {
    return (
      <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
        {IconComponent}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
      <TouchableOpacity
        onPress={() => {
          if (onPress && !disabled) {
            onPress();
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => {
          if (onLongPress && !disabled && hapticFeedback) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onLongPress();
          }
        }}
        style={styles.touchableArea}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {IconComponent}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  touchableArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 20,
  },
});

export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  "2xl": 32,
} as const;

export const IconAnimations = {
  none: "none",
  pulse: "pulse",
  bounce: "bounce",
  rotate: "rotate",
  shake: "shake",
  fade: "fade",
  scale: "scale",
} as const;
