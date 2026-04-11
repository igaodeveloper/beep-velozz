import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../utils/themeContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  forceClose?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
  forceClose,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const { width, height } = useWindowDimensions();

  // Calculate responsive sizes based on screen dimensions
  const logoSize = Math.min(width * 0.25, height * 0.15, 120); // Max 120px
  const fontSize = Math.min(width * 0.06, 32); // Max 32px
  const taglineSize = Math.min(width * 0.04, 14); // Max 14px
  const progressWidth = width * 0.7; // 70% of screen width

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // If forceClose is true, exit immediately
    if (forceClose) {
      onAnimationComplete?.();
      return;
    }

    // Optimized animation sequence - max 2 seconds total
    const animationSequence = Animated.sequence([
      // Initial fade in and scale - reduced to 300ms
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
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

      // Logo rotation - reduced to 500ms
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      // Progress bar animation - reduced to 800ms
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),

      // Slide up text - reduced to 300ms
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current = animationSequence;
    animationSequence.start(() => {
      // Reduced hold time from 300ms to 100ms
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300, // Reduced from 400ms to 300ms
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete?.();
        });
      }, 100);
    });

    return () => {
      animationRef.current?.stop();
    };
  }, [forceClose, onAnimationComplete]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "180deg", "360deg"],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Background gradient with overlay */}
      <LinearGradient
        colors={
          isDark
            ? ["#000000", "#0a0a0a", "#1a1a1a"]
            : ["#ffffff", "#f9fafb", "#f3f4f6"]
        }
        style={styles.gradient}
      />

      {/* Animated content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo container com imagem do projeto */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              width: logoSize * 1.2,
              height: logoSize * 1.2,
              transform: [{ rotate: logoRotate }],
            },
          ]}
        >
          <View
            style={[
              styles.logoCircle,
              {
                width: logoSize * 1.1,
                height: logoSize * 1.1,
                borderRadius: (logoSize * 1.1) / 2,
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
          >
            <Image
              source={require("../assets/images/icon.png")}
              style={[
                styles.logoImage,
                {
                  width: logoSize * 0.8,
                  height: logoSize * 0.8,
                  borderRadius: (logoSize * 0.8) / 8,
                },
              ]}
              resizeMode="contain"
            />
            {/* Inner glow effect */}
            <View
              style={[
                styles.innerGlow,
                {
                  backgroundColor: theme.colors.primary,
                  width: logoSize * 0.6,
                  height: logoSize * 0.6,
                  borderRadius: (logoSize * 0.6) / 2,
                  top: (logoSize * 1.1 - logoSize * 0.6) / 2,
                  left: (logoSize * 1.1 - logoSize * 0.6) / 2,
                },
              ]}
            />
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
                      translateX: logoSize * 0.7,
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
          <Text
            style={[
              styles.appName,
              {
                color: theme.colors.text,
                fontSize: fontSize,
              },
            ]}
          >
            Beep Velozz
          </Text>
          <Text
            style={[
              styles.tagline,
              {
                color: theme.colors.textMuted,
                fontSize: taglineSize,
              },
            ]}
          >
            Scanner Industrial Inteligente
          </Text>
        </Animated.View>

        {/* Enhanced progress bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBackground,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#e5e7eb",
                width: progressWidth,
              },
            ]}
          >
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
            style={[
              styles.progressText,
              {
                color: theme.colors.textMuted,
                opacity: progressAnim,
              },
            ]}
          >
            Carregando...
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Enhanced decorative elements */}
      <View style={styles.decorativeElements}>
        {[...Array(8)].map((_, index) => {
          const angle = (index * 45 * Math.PI) / 180;
          const distance = logoSize * 1.5; // Responsive distance based on logo size
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
                  opacity: 0.1 + index * 0.05,
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
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    paddingHorizontal: "5%",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  logoCircle: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
    position: "relative",
    overflow: "hidden",
  },
  logoImage: {
    // Responsive sizing handled by props
    zIndex: 1,
  },
  innerGlow: {
    position: "absolute",
    opacity: 0.3,
  },
  orbitDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  progressContainer: {
    alignItems: "center",
    width: "100%",
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  progressGlow: {
    position: "absolute",
    height: "100%",
    borderRadius: 3,
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// Import dark theme for the component
import { darkTheme, lightTheme } from "../utils/theme";
