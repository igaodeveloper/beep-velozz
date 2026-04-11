/**
 * Botão Animado Profissional
 * Microinterações premium para UX excepcional
 */

import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  GestureResponderEvent,
  View,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AnimatedButton({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const { colors } = useAppTheme();
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case "danger":
        return {
          backgroundColor: colors.danger,
          borderWidth: 0,
        };
      case "success":
        return {
          backgroundColor: colors.success,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
        };
      case "medium":
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        };
      case "large":
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 16,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "medium":
        return 16;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const getTextColor = () => {
    if (variant === "secondary") {
      return colors.primary;
    }
    return "#ffffff";
  };

  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
    opacity: opacityValue,
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          getVariantStyles(),
          getSizeStyles(),
          disabled && styles.disabled,
          loading && styles.loading,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Text
            style={[
              styles.text,
              { fontSize: getTextSize(), color: getTextColor() },
              textStyle,
            ]}
          >
            Carregando...
          </Text>
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                { fontSize: getTextSize(), color: getTextColor() },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  loading: {
    opacity: 0.7,
  },
});
