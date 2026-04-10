/**
 * Premium Button - Microinteractions Avançadas
 * Botão premium com haptics, animações e feedback visual excepcional
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: string[];
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  rippleEffect?: boolean;
  glowEffect?: boolean;
  pulseEffect?: boolean;
  scaleEffect?: boolean;
  shadowEffect?: boolean;
  children?: React.ReactNode;
  style?: any;
  textStyle?: any;
}

interface ButtonTheme {
  background: string[];
  text: string;
  border: string;
  shadow: string;
  glow: string;
}

const THEMES: Record<string, ButtonTheme> = {
  primary: {
    background: ['#FF6B35', '#F7931E'],
    text: '#FFFFFF',
    border: '#FF6B35',
    shadow: '#FF6B3540',
    glow: '#FF6B3520',
  },
  secondary: {
    background: ['#667EEA', '#764BA2'],
    text: '#FFFFFF',
    border: '#667EEA',
    shadow: '#667EEA40',
    glow: '#667EEA20',
  },
  tertiary: {
    background: ['#48BB78', '#38A169'],
    text: '#FFFFFF',
    border: '#48BB78',
    shadow: '#48BB7840',
    glow: '#48BB7820',
  },
  ghost: {
    background: ['transparent', 'transparent'],
    text: '#667EEA',
    border: '#667EEA',
    shadow: 'transparent',
    glow: '#667EEA10',
  },
  glass: {
    background: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.2)',
    shadow: '#00000020',
    glow: '#FFFFFF10',
  },
};

const SIZES = {
  xs: { height: 32, paddingHorizontal: 12, fontSize: 12, borderRadius: 8 },
  sm: { height: 40, paddingHorizontal: 16, fontSize: 14, borderRadius: 10 },
  md: { height: 48, paddingHorizontal: 20, fontSize: 16, borderRadius: 12 },
  lg: { height: 56, paddingHorizontal: 24, fontSize: 18, borderRadius: 14 },
  xl: { height: 64, paddingHorizontal: 28, fontSize: 20, borderRadius: 16 },
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient,
  hapticType = 'medium',
  rippleEffect = true,
  glowEffect = true,
  pulseEffect = false,
  scaleEffect = true,
  shadowEffect = true,
  children,
  style,
  textStyle,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{x: number, y: number, id: number}>>([]);
  const buttonRef = useRef<View>(null);
  
  // Animações
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(shadowEffect ? 1 : 0)).current;

  const theme = THEMES[variant] ?? THEMES.primary!;
  const sizeConfig = SIZES[size];
  const buttonGradient = gradient || theme.background;
  
  // Ensure gradient has at least 2 colors for LinearGradient
  const safeGradient = buttonGradient.length >= 2 
    ? buttonGradient 
    : [buttonGradient[0] || '#FF6B35', buttonGradient[1] || '#F7931E'];

  // Efeito de pulse
  useEffect(() => {
    if (pulseEffect && !disabled && !loading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    }
  }, [pulseEffect, disabled, loading, pulseAnim]);

  // Animação de loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingAnim.setValue(0);
    }
  }, [loading, loadingAnim]);

  // Efeito de glow
  useEffect(() => {
    if (glowEffect && isPressed) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [glowEffect, isPressed, glowAnim]);

  // Efeito de scale
  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }

    if (shadowEffect) {
      Animated.timing(shadowAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }

    // Haptic feedback
    triggerHaptic(hapticType);
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }

    if (shadowEffect) {
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    // Adiciona ripple effect
    if (rippleEffect) {
      const newRipple = {
        x: Math.random() * 100,
        y: Math.random() * 100,
        id: Date.now(),
      };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple após animação
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Executa onPress após animações
    InteractionManager.runAfterInteractions(() => {
      onPress();
    });
  };

  const triggerHaptic = (type: string) => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

  // Renderiza conteúdo do botão
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.spinner,
              {
                transform: [
                  {
                    rotate: loadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text
            style={[
              styles.text,
              {
                color: theme.text,
                fontSize: sizeConfig.fontSize,
                marginLeft: 8,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        
        <Text
          style={[
            styles.text,
            {
              color: theme.text,
              fontSize: sizeConfig.fontSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
        
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
        
        {children}
      </>
    );
  };

  // Estilo dinâmico baseado no estado
  const buttonStyle = [
    styles.button,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: sizeConfig.borderRadius,
      opacity: disabled ? 0.5 : 1,
    },
    style,
  ];

  // Efeito de glow
  const glowStyle = glowEffect ? {
    position: 'absolute' as const,
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: sizeConfig.borderRadius + 4,
    backgroundColor: theme.glow,
    opacity: glowAnim,
  } : null;

  // Efeito de shadow
  const shadowStyle = shadowEffect ? {
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: shadowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0.4],
    }),
    shadowRadius: 8,
    elevation: 8,
  } : null;

  return (
    <View style={styles.container}>
      {/* Glow Effect */}
      {glowStyle && <Animated.View style={glowStyle} />}
      
      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            {
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
            },
          ]}
        />
      ))}
      
      {/* Main Button */}
      <Animated.View
        style={[
          buttonStyle,
          {
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          },
          shadowStyle,
        ]}
        ref={buttonRef}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          {variant === 'glass' ? (
            <BlurView
              intensity={20}
              style={styles.glassContainer}
              tint="light"
            >
              {renderContent()}
            </BlurView>
          ) : (
            <LinearGradient
              colors={safeGradient as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientContainer}
            >
              {renderContent()}
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  button: {
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  glassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: 8,
  },
  ripple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
});

export default PremiumButton;
