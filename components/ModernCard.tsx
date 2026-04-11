import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import * as Haptics from "expo-haptics";

export type CardVariant =
  | "default"
  | "elevated"
  | "outlined"
  | "glass"
  | "gradient";
export type CardSize = "sm" | "md" | "lg" | "xl";
export type CardStatus =
  | "default"
  | "loading"
  | "disabled"
  | "success"
  | "error"
  | "warning";

interface ModernCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  size?: CardSize;
  status?: CardStatus;
  fullWidth?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  animated?: boolean;
  hapticFeedback?: boolean;
  rightComponent?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function ModernCard({
  title,
  subtitle,
  description,
  icon,
  children,
  onPress,
  variant = "default",
  size = "md",
  status = "default",
  fullWidth = false,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  descriptionStyle,
  animated = true,
  hapticFeedback = true,
  rightComponent,
  badge,
}: ModernCardProps) {
  const { colors } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const targetOpacity = status === "disabled" ? 0.5 : 1;
      const targetShadow = variant === "elevated" ? 1 : 0;

      Animated.timing(opacityAnim, {
        toValue: targetOpacity,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.timing(shadowAnim, {
        toValue: targetShadow,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [status, variant, animated]);

  const handlePressIn = () => {
    if (status === "disabled" || !onPress) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (status === "disabled" || !onPress) return;

    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: getBorderRadius(),
      overflow: "hidden",
      opacity: status === "disabled" ? 0.5 : 1,
    };

    const variantStyles = {
      default: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      },
      elevated: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: colors.border,
      },
      glass: {
        backgroundColor: colors.surface + "40",
        borderWidth: 1,
        borderColor: colors.border + "60",
        backdropFilter: "blur(10px)",
      },
      gradient: {
        backgroundColor: colors.primary + "10",
        borderWidth: 1,
        borderColor: colors.primary + "30",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    };

    const statusStyles: Record<string, any> = {
      success: {
        borderColor: colors.success,
        borderWidth: 2,
      },
      error: {
        borderColor: colors.danger,
        borderWidth: 2,
      },
      warning: {
        borderColor: colors.warning,
        borderWidth: 2,
      },
      loading: {
        opacity: 0.7,
      },
      disabled: {
        opacity: 0.5,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...(status !== "default" && statusStyles[status]),
      ...style,
    };
  };

  const getPadding = (): {
    paddingHorizontal: number;
    paddingVertical: number;
  } => {
    const paddingMap = {
      sm: { paddingHorizontal: 16, paddingVertical: 12 },
      md: { paddingHorizontal: 20, paddingVertical: 16 },
      lg: { paddingHorizontal: 24, paddingVertical: 20 },
      xl: { paddingHorizontal: 28, paddingVertical: 24 },
    };
    return paddingMap[size];
  };

  const getBorderRadius = (): number => {
    const radiusMap = {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    };
    return radiusMap[size];
  };

  const animatedStyle = animated
    ? {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        shadowOpacity: shadowAnim,
      }
    : {};

  const CardContent = (
    <View style={[styles.cardContent, getPadding(), contentStyle]}>
      {/* Header Section */}
      {(title || icon || subtitle || rightComponent || badge) && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {icon && (
              <View
                style={[styles.iconContainer, { marginRight: title ? 12 : 0 }]}
              >
                {React.cloneElement(icon as React.ReactElement<any>, {
                  width: getIconSize(),
                  height: getIconSize(),
                  color: colors.primary,
                })}
              </View>
            )}
            <View style={styles.textContainer}>
              {title && (
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: getTitleFontSize() },
                    titleStyle,
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: colors.textMuted,
                      fontSize: getSubtitleFontSize(),
                    },
                    subtitleStyle,
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {badge}
            {rightComponent}
          </View>
        </View>
      )}

      {/* Description */}
      {description && (
        <Text
          style={[
            styles.description,
            { color: colors.textMuted, fontSize: getDescriptionFontSize() },
            descriptionStyle,
          ]}
        >
          {description}
        </Text>
      )}

      {/* Children */}
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );

  if (onPress && status !== "disabled") {
    return (
      <Animated.View
        style={[{ width: fullWidth ? "100%" : "auto" }, animatedStyle]}
      >
        <TouchableOpacity
          style={getCardStyle()}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {CardContent}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        getCardStyle(),
        { width: fullWidth ? "100%" : "auto" },
        animatedStyle,
      ]}
    >
      {CardContent}
    </Animated.View>
  );
}

function getIconSize(): number {
  return 20;
}

function getTitleFontSize(): number {
  return 16;
}

function getSubtitleFontSize(): number {
  return 14;
}

function getDescriptionFontSize(): number {
  return 13;
}

const styles = StyleSheet.create({
  cardContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: "400",
  },
  description: {
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 4,
  },
  childrenContainer: {
    marginTop: 12,
  },
});

export const CardVariants = {
  default: "default",
  elevated: "elevated",
  outlined: "outlined",
  glass: "glass",
  gradient: "gradient",
} as const;

export const CardSizes = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
} as const;
