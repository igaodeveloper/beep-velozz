/**
 * Pulse Indicator - Indicador Visual Animado
 * Para feedback visual em tempo real
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';

interface PulseIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  intensity?: 'light' | 'medium' | 'strong';
  duration?: number;
  isActive?: boolean;
}

export default function PulseIndicator({
  size = 'medium',
  color,
  intensity = 'medium',
  duration = 1500,
  isActive = true,
}: PulseIndicatorProps) {
  const { colors } = useAppTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.8)).current;

  const getSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 20;
      case 'large':
        return 32;
      default:
        return 20;
    }
  };

  const getIntensityScale = () => {
    switch (intensity) {
      case 'light':
        return 1.2;
      case 'medium':
        return 1.5;
      case 'strong':
        return 2;
      default:
        return 1.5;
    }
  };

  const getIntensityOpacity = () => {
    switch (intensity) {
      case 'light':
        return 0.3;
      case 'medium':
        return 0.2;
      case 'strong':
        return 0.1;
      default:
        return 0.2;
    }
  };

  const pulseColor = color || colors.primary;

  useEffect(() => {
    if (!isActive) return;

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        // Scale up
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: getIntensityScale(),
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: getIntensityOpacity(),
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        // Scale down
        Animated.parallel([
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.8,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [isActive, duration, intensity]);

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
    opacity: opacityValue,
  };

  const containerSize = getSize() * 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      {/* Pulse rings */}
      <Animated.View
        style={[
          styles.pulseRing,
          animatedStyle,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: pulseColor,
          },
        ]}
      />
      
      {/* Core dot */}
      <View
        style={[
          styles.coreDot,
          {
            width: getSize(),
            height: getSize(),
            borderRadius: getSize() / 2,
            backgroundColor: pulseColor,
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -getSize() / 2,
            marginLeft: -getSize() / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  coreDot: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
