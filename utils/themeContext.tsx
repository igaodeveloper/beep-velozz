import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    (systemColorScheme as ColorScheme) || 'light'
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Carregar preferência salva
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme-preference');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setColorSchemeState(savedTheme);
        } else if (systemColorScheme) {
          setColorSchemeState(systemColorScheme as ColorScheme);
        }
      } catch (error) {
        // Fallback ao tema do sistema
        if (systemColorScheme) {
          setColorSchemeState(systemColorScheme as ColorScheme);
        }
      }
      setIsLoaded(true);
    };

    loadTheme();
  }, [systemColorScheme]);

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    try {
      await AsyncStorage.setItem('theme-preference', scheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        setColorScheme,
        isDark: colorScheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
