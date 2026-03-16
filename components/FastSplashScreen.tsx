import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, useWindowDimensions } from 'react-native';
import { useTheme } from '../utils/themeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface FastSplashScreenProps {
  onAnimationComplete?: () => void;
}

export const FastSplashScreen: React.FC<FastSplashScreenProps> = ({ onAnimationComplete }) => {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const { width, height } = useWindowDimensions();

  // Complete immediately after mounting
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 500); // Just 500ms minimum to show something

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  // Calculate responsive sizes based on screen dimensions
  const logoSize = Math.min(width * 0.25, height * 0.15, 120); // Max 120px
  const fontSize = Math.min(width * 0.06, 32); // Max 32px
  const taglineSize = Math.min(width * 0.04, 14); // Max 14px

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <LinearGradient
        colors={isDark 
          ? ['#000000', '#0a0a0a', '#1a1a1a'] 
          : ['#ffffff', '#f9fafb', '#f3f4f6']
        }
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        {/* Logo com imagem do projeto */}
        <View style={[styles.logoContainer, { 
          width: logoSize * 1.2,
          height: logoSize * 1.2,
          borderRadius: (logoSize * 1.2) / 2,
        }]}>
          <Image 
            source={require('../assets/images/icon.png')}
            style={[
              styles.logoImage,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize / 8, // Slightly rounded corners
              }
            ]}
            resizeMode="contain"
          />
        </View>
        
        <Text style={[
          styles.appName, 
          { 
            color: theme.colors.text,
            fontSize: fontSize,
            marginTop: height * 0.03,
          }
        ]}>
          Beep Velozz
        </Text>
        <Text style={[
          styles.tagline, 
          { 
            color: theme.colors.textMuted,
            fontSize: taglineSize,
          }
        ]}>
          Scanner Industrial
        </Text>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingHorizontal: '5%',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    // Responsive sizing handled by props
  },
  appName: {
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 5,
  },
});

// Import themes
import { darkTheme, lightTheme } from '../utils/theme';
