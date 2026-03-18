import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName, themePresets, getTheme } from './theme';

interface ThemeContextType {
  themeName: ThemeName;
  setThemeName: (theme: ThemeName) => void;
  isDark: boolean;
  colors: any;
  theme: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme-preference');
        if (savedTheme && Object.keys(themePresets).includes(savedTheme)) {
          setThemeNameState(savedTheme as ThemeName);
        } else if (systemColorScheme === 'dark') {
          setThemeNameState('dark');
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
      setIsLoaded(true);
    };

    loadTheme();
  }, [systemColorScheme]);

  const setThemeName = async (theme: ThemeName) => {
    setThemeNameState(theme);
    try {
      await AsyncStorage.setItem('theme-preference', theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const currentTheme = getTheme(themeName);
  const isDark = themeName === 'dark' || themeName === 'midnight' || themeName === 'ocean' || themeName === 'forest' || themeName === 'volcano' || themeName === 'rose' || themeName === 'emerald' || themeName === 'amber' || themeName === 'sunset';

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        setThemeName,
        isDark,
        colors: currentTheme.colors,
        theme: currentTheme,
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
