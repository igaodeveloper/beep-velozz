/**
 * Glass Card Component - UI Moderna e Premium
 * Efeito glassmorphism com blur e transparência
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/utils/useAppTheme';

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'light' | 'medium' | 'dark';
  rounded?: 'small' | 'medium' | 'large';
  padding?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

export default function GlassCard({
  children,
  variant = 'medium',
  rounded = 'medium',
  padding = 'medium',
  style,
  onPress,
  disabled = false,
  ...props
}: GlassCardProps) {
  const { colors } = useAppTheme();

  const getBlurIntensity = () => {
    switch (variant) {
      case 'light':
        return 10;
      case 'medium':
        return 20;
      case 'dark':
        return 30;
      default:
        return 20;
    }
  };

  const getBorderRadius = () => {
    switch (rounded) {
      case 'small':
        return 8;
      case 'medium':
        return 16;
      case 'large':
        return 24;
      default:
        return 16;
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'small':
        return 12;
      case 'medium':
        return 20;
      case 'large':
        return 28;
      default:
        return 20;
    }
  };

  const getBackgroundColor = () => {
    if (colors.bg === '#ffffff') {
      return 'rgba(255, 255, 255, 0.7)';
    }
    return 'rgba(0, 0, 0, 0.3)';
  };

  const getBorderColor = () => {
    if (colors.bg === '#ffffff') {
      return 'rgba(255, 255, 255, 0.2)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.container,
        {
          borderRadius: getBorderRadius(),
          padding: getPadding(),
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <BlurView
        intensity={getBlurIntensity()}
        style={[
          styles.blur,
          {
            borderRadius: getBorderRadius() - 1,
          },
        ]}
        tint={colors.bg === '#ffffff' ? 'light' : 'dark'}
      >
        {children}
      </BlurView>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
  },
});
