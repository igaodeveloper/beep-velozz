import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../utils/themeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animation sequence with reduced timing for max 4 seconds total
    const animationSequence = Animated.sequence([
      // Initial fade in and scale - reduced from 600ms to 400ms
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Logo rotation with easing - reduced from 1200ms to 800ms
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Continuous pulse effect - reduced from 1500ms to 1000ms
      Animated.loop(
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
      ),
      
      // Shimmer effect - reduced from 2000ms to 1200ms
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ),
      
      // Progress bar animation - reduced from 2500ms to 1500ms
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
      
      // Slide up text - reduced from 800ms to 500ms
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      // Reduced hold time from 800ms to 300ms to ensure max 4 seconds total
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400, // Reduced from 600ms to 400ms
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete?.();
        });
      }, 300);
    });

    return () => {
      animationSequence.stop();
    };
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const logoScale = Animated.multiply(scaleAnim, pulseAnim);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Background gradient with overlay */}
      <LinearGradient
        colors={isDark 
          ? ['#000000', '#0a0a0a', '#1a1a1a'] 
          : ['#ffffff', '#f9fafb', '#f3f4f6']
        }
        style={styles.gradient}
      />
      
      {/* Shimmer overlay effect */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
      
      {/* Animated content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: logoScale },
            ],
          },
        ]}
      >
        {/* Logo container with enhanced effects */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { rotate: logoRotate },
              ],
            },
          ]}
        >
          <View style={[styles.logoCircle, { 
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          }]}>
            <Text style={[styles.logoText, { color: '#ffffff' }]}>
              BV
            </Text>
            {/* Inner glow effect */}
            <View style={[styles.innerGlow, { 
              backgroundColor: theme.colors.primary,
            }]} />
          </View>
          
          {/* Orbiting dots */}
          {[0, 120, 240].map((rotation, index) => (
            <Animated.View
              key={index}
              style={[
                styles.orbitDot,
                {
                  backgroundColor: theme.colors.primary,
                  transform: [
                    {
                      rotate: logoRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${rotation}deg`, `${rotation + 360}deg`],
                      }),
                    },
                    {
                      translateX: 70,
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* App name with enhanced typography */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Text style={[styles.appName, { color: theme.colors.text }]}>
            Beep Velozz
          </Text>
          <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
            Scanner Industrial Inteligente
          </Text>
        </Animated.View>

        {/* Enhanced progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { 
            backgroundColor: isDark ? '#1a1a1a' : '#e5e7eb' 
          }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.colors.primary,
                  width: progressBarWidth,
                  shadowColor: theme.colors.primary,
                },
              ]}
            />
            {/* Progress glow */}
            <Animated.View
              style={[
                styles.progressGlow,
                {
                  backgroundColor: theme.colors.primary,
                  width: progressBarWidth,
                },
              ]}
            />
          </View>
          <Animated.Text 
            style={[styles.progressText, { 
              color: theme.colors.textMuted,
              opacity: progressAnim,
            }]}
          >
            Carregando...
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Enhanced decorative elements */}
      <View style={styles.decorativeElements}>
        {[...Array(8)].map((_, index) => {
          const angle = (index * 45) * Math.PI / 180;
          const distance = 120;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.decorativeDot,
                {
                  backgroundColor: theme.colors.primary,
                  left: width / 2 + x - 2,
                  top: height / 2 + y - 2,
                  opacity: 0.1 + (index * 0.05),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [1, 1.2 + (index * 0.05)],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: width * 0.3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 30,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
    top: 20,
    left: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    zIndex: 1,
  },
  orbitDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  progressContainer: {
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  progressGlow: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// Import dark theme for the component
import { darkTheme, lightTheme } from '../utils/theme';
