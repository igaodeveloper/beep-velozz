import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonStatus = 'default' | 'loading' | 'disabled' | 'success';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  status?: ButtonStatus;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  animated?: boolean;
}

export default function ModernButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  status = 'default',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  animated = true,
}: ModernButtonProps) {
  const { colors } = useAppTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(scaleAnim, {
        toValue: status === 'loading' ? 0.95 : 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.timing(opacityAnim, {
        toValue: status === 'disabled' ? 0.5 : 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [status, animated]);

  const handlePressIn = () => {
    if (status === 'default' && hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (animated && status === 'default') {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated && status === 'default') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handlePress = () => {
    if (status === 'default' && onPress) {
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: getBorderRadius(),
      borderWidth: getBorderWidth(),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
      opacity: status === 'disabled' ? 0.5 : 1,
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary,
        borderColor: 'transparent',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      secondary: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        borderWidth: 2,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      gradient: {
        backgroundColor: colors.primary,
        borderColor: 'transparent',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
      glass: {
        backgroundColor: colors.surface + '20',
        borderColor: colors.border + '40',
        borderWidth: 1,
        backdropFilter: 'blur(10px)',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    const variantStyles = {
      primary: { color: '#ffffff' },
      secondary: { color: colors.text },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
      gradient: { color: '#ffffff' },
      glass: { color: colors.text },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  const getBorderRadius = (): number => {
    const sizeMap = {
      xs: 6,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    };
    return sizeMap[size];
  };

  const getBorderWidth = (): number => {
    if (variant === 'outline') return 2;
    if (variant === 'secondary') return 1;
    return 0;
  };

  const getPadding = (): { paddingHorizontal: number; paddingVertical: number } => {
    const paddingMap = {
      xs: { paddingHorizontal: 12, paddingVertical: 6 },
      sm: { paddingHorizontal: 16, paddingVertical: 8 },
      md: { paddingHorizontal: 20, paddingVertical: 12 },
      lg: { paddingHorizontal: 24, paddingVertical: 16 },
      xl: { paddingHorizontal: 32, paddingVertical: 20 },
    };
    return paddingMap[size];
  };

  const getFontSize = (): number => {
    const sizeMap = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };
    return sizeMap[size];
  };

  const getIconSize = (): number => {
    const sizeMap = {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 24,
    };
    return sizeMap[size];
  };

  const animatedStyle = animated
    ? {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }
    : {};

  return (
    <Animated.View style={[{ width: fullWidth ? '100%' : 'auto' }, animatedStyle]}>
      <TouchableOpacity
        style={[
          getButtonStyle(),
          getPadding(),
          { minWidth: fullWidth ? '100%' : getMinWidth() },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={status === 'loading' || status === 'disabled'}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {status === 'loading' ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#ffffff'}
            style={{ marginRight: 8 }}
          />
        ) : (
          icon && (
            <View style={{ 
              marginHorizontal: 8,
              opacity: status === 'disabled' ? 0.5 : 1 
            }}>
              {React.cloneElement(icon as React.ReactElement<any>, {
                width: getIconSize(),
                height: getIconSize(),
                color: variant === 'primary' || variant === 'gradient' ? '#ffffff' : colors.primary,
              })}
            </View>
          )
        )}
        
        <Text
          style={[
            getTextStyle(),
            { fontSize: getFontSize() },
            icon ? { marginHorizontal: 4 } : {},
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getMinWidth(): number {
  return 120;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
