import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useAppTheme } from "@/utils/useAppTheme";
import { advancedHaptics } from "@/utils/advancedHaptics";

interface AnimatedIconProps {
  children: React.ReactElement<{ size?: number; color?: string }>;
  size?: number;
  color?: string;
  animationType?:
    | "pulse"
    | "bounce"
    | "shake"
    | "rotate"
    | "scale"
    | "glow"
    | "none";
  animationDuration?: number;
  autoPlay?: boolean;
  triggerAnimation?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
  hapticType?:
    | "light"
    | "medium"
    | "heavy"
    | "selection"
    | "success"
    | "error"
    | "warning";
}

export function AnimatedIcon({
  children,
  size = 24,
  color,
  animationType = "none",
  animationDuration = 1000,
  autoPlay = false,
  triggerAnimation = false,
  onPress,
  onLongPress,
  style,
  hapticType = "light",
}: AnimatedIconProps) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}rad` },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle((): any => ({
    opacity: glowOpacity.value,
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowOpacity.value * 20,
    shadowOffset: {
      width: 0,
      height: glowOpacity.value * 10,
    },
  }));

  const triggerHaptic = () => {
    if (hapticType === "light") advancedHaptics.onButtonPress();
    else if (hapticType === "medium")
      advancedHaptics.trigger({ type: "medium" });
    else if (hapticType === "heavy") advancedHaptics.trigger({ type: "heavy" });
    else if (hapticType === "selection")
      advancedHaptics.trigger({ type: "selection" });
    else if (hapticType === "success")
      advancedHaptics.trigger({ type: "success" });
    else if (hapticType === "error") advancedHaptics.trigger({ type: "error" });
    else if (hapticType === "warning")
      advancedHaptics.trigger({ type: "warning" });
  };

  const animate = () => {
    switch (animationType) {
      case "pulse":
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, {
              duration: animationDuration / 2,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
            withTiming(1, {
              duration: animationDuration / 2,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
          ),
          -1,
          true,
        );
        break;

      case "bounce":
        translateY.value = withRepeat(
          withSequence(
            withTiming(-15, {
              duration: animationDuration / 4,
              easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
            }),
            withTiming(0, {
              duration: animationDuration / 4,
              easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
            }),
          ),
          -1,
          true,
        );
        break;

      case "shake":
        translateX.value = withSequence(
          withTiming(-10, { duration: 100, easing: Easing.linear }),
          withTiming(10, { duration: 100, easing: Easing.linear }),
          withTiming(-10, { duration: 100, easing: Easing.linear }),
          withTiming(10, { duration: 100, easing: Easing.linear }),
          withTiming(0, { duration: 100, easing: Easing.linear }),
        );
        break;

      case "rotate":
        rotate.value = withRepeat(
          withTiming(Math.PI * 2, {
            duration: animationDuration,
            easing: Easing.linear,
          }),
          -1,
          false,
        );
        break;

      case "scale":
        scale.value = withSequence(
          withTiming(1.3, {
            duration: 200,
            easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          }),
          withTiming(1, {
            duration: 200,
            easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          }),
        );
        break;

      case "glow":
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, {
              duration: animationDuration / 2,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
            withTiming(0, {
              duration: animationDuration / 2,
              easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            }),
          ),
          -1,
          true,
        );
        break;

      default:
        break;
    }
  };

  const handlePress = () => {
    triggerHaptic();
    if (animationType === "scale") {
      scale.value = withSequence(
        withTiming(0.8, {
          duration: 100,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
        withTiming(1, {
          duration: 100,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
      );
    }
    onPress?.();
  };

  const handleLongPress = () => {
    triggerHaptic();
    if (animationType === "shake") {
      animate();
    }
    onLongPress?.();
  };

  useEffect(() => {
    if (autoPlay && animationType !== "none") {
      animate();
    }
  }, [autoPlay, animationType]);

  useEffect(() => {
    if (triggerAnimation && animationType !== "none") {
      animate();
    }
  }, [triggerAnimation]);

  const iconColor = color || colors.primary;

  return (
    <View style={[styles.container, style] as any}>
      <Animated.View style={[styles.glowContainer as any, glowStyle] as any}>
        <Animated.View style={[animatedStyle as any, styles.iconContainer as any]}>
          {React.cloneElement(children, {
            size,
            color: iconColor,
          })}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Componentes de ícones específicos com animações
export function AnimatedHomeIcon(props: Omit<AnimatedIconProps, "children">) {
  const { Home } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="bounce">
      <Home />
    </AnimatedIcon>
  );
}

export function AnimatedCameraIcon(props: Omit<AnimatedIconProps, "children">) {
  const { Camera } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="pulse">
      <Camera />
    </AnimatedIcon>
  );
}

export function AnimatedBarChartIcon(
  props: Omit<AnimatedIconProps, "children">,
) {
  const { BarChart3 } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="scale">
      <BarChart3 />
    </AnimatedIcon>
  );
}

export function AnimatedHistoryIcon(
  props: Omit<AnimatedIconProps, "children">,
) {
  const { History } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="rotate">
      <History />
    </AnimatedIcon>
  );
}

export function AnimatedSettingsIcon(
  props: Omit<AnimatedIconProps, "children">,
) {
  const { Settings } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="rotate">
      <Settings />
    </AnimatedIcon>
  );
}

export function AnimatedPackageIcon(
  props: Omit<AnimatedIconProps, "children">,
) {
  const { Package } = require("lucide-react-native");
  return (
    <AnimatedIcon {...props} animationType="bounce">
      <Package />
    </AnimatedIcon>
  );
}

// Ícone de loading animado
export function AnimatedLoadingIcon({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [{ rotate: `${rotate.value}rad` }, { scale: scale.value }],
  }));

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 1000, easing: Easing.linear }),
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
  }, []);

  const { Loader } = require("lucide-react-native");
  const { colors } = useAppTheme();

  return (
    <Animated.View style={animatedStyle as any}>
      <Loader size={size} color={color || colors.primary} />
    </Animated.View>
  );
}

// Ícone de sucesso animado
export function AnimatedSuccessIcon({
  size = 24,
  trigger,
}: {
  size?: number;
  trigger?: boolean;
}) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}rad` }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withTiming(0, { duration: 100 }),
        withSpring(1.2, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );

      rotate.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(Math.PI / 8, {
          duration: 200,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        }),
        withTiming(0, {
          duration: 200,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        }),
      );

      opacity.value = withTiming(1, { duration: 100 });

      advancedHaptics.onAchievement();
    }
  }, [trigger]);

  const { CheckCircle } = require("lucide-react-native");
  const { colors } = useAppTheme();

  return (
    <Animated.View style={animatedStyle as any}>
      <CheckCircle size={size} color={colors.success} />
    </Animated.View>
  );
}

// Ícone de erro animado
export function AnimatedErrorIcon({
  size = 24,
  trigger,
}: {
  size?: number;
  trigger?: boolean;
}) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withTiming(0, { duration: 100 }),
        withSpring(1.3, { damping: 5, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );

      translateX.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );

      advancedHaptics.onScanError();
    }
  }, [trigger]);

  const { XCircle } = require("lucide-react-native");
  const { colors } = useAppTheme();

  return (
    <Animated.View style={animatedStyle as any}>
      <XCircle size={size} color={colors.danger} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
