import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints para diferentes dispositivos
export const BREAKPOINTS = {
  xs: 0,
  sm: 384,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

export type DeviceSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isUltraWide: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  size: DeviceSize;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
  pixelRatio: number;
  fontScale: number;
}

// Configurações responsivas baseadas no tamanho
const getResponsiveConfig = (width: number, height: number): ResponsiveConfig => {
  const pixelRatio = Platform.select({
    ios: 2, // iOS devices typically have 2x pixel ratio
    android: 1.5, // Android varies, but 1.5 is a safe default
    default: 1,
  });

  const fontScale = Platform.select({
    ios: 1,
    android: 1,
    default: 1,
  });

  const aspectRatio = width / height;
  const isPortrait = height > width;
  const isLandscape = width > height;
  const isUltraWide = aspectRatio > 2.0;

  let size: DeviceSize = 'xs';
  if (width >= BREAKPOINTS.xxl) size = 'xxl';
  else if (width >= BREAKPOINTS.xl) size = 'xl';
  else if (width >= BREAKPOINTS.lg) size = 'lg';
  else if (width >= BREAKPOINTS.md) size = 'md';
  else if (width >= BREAKPOINTS.sm) size = 'sm';

  const isMobile = size === 'xs' || size === 'sm';
  const isTablet = size === 'md';
  const isDesktop = size === 'lg' || size === 'xl';
  const isLargeDesktop = size === 'xxl';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isUltraWide,
    isPortrait,
    isLandscape,
    size,
    screenWidth: width,
    screenHeight: height,
    aspectRatio,
    pixelRatio,
    fontScale,
  };
};

export function useResponsive(): ResponsiveConfig {
  const [config, setConfig] = useState(() => 
    getResponsiveConfig(screenWidth, screenHeight)
  );

  useEffect(() => {
    const onChange = ({ window: { width, height } }: any) => {
      setConfig(getResponsiveConfig(width, height));
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  return config;
}

// Hook para valores responsivos
export function useResponsiveValue<T>(
  values: Partial<Record<DeviceSize, T>>,
  defaultValue: T
): T {
  const { size } = useResponsive();
  
  // Find the largest breakpoint that has a value
  const sizeOrder: DeviceSize[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  
  for (const currentSize of sizeOrder) {
    if (values[currentSize] !== undefined) {
      // Check if current device size is >= the breakpoint
      if (screenWidth >= BREAKPOINTS[currentSize]) {
        return values[currentSize]!;
      }
    }
  }
  
  return defaultValue;
}

// Hook para breakpoints específicos
export function useBreakpoint() {
  const config = useResponsive();
  
  return {
    isUp: (breakpoint: DeviceSize) => screenWidth >= BREAKPOINTS[breakpoint],
    isDown: (breakpoint: DeviceSize) => screenWidth < BREAKPOINTS[breakpoint],
    isBetween: (min: DeviceSize, max: DeviceSize) => 
      screenWidth >= BREAKPOINTS[min] && screenWidth < BREAKPOINTS[max],
  };
}

// Sistema de grid responsivo
export interface GridConfig {
  columns: number;
  gap: number;
  padding: number;
  maxWidth: number;
}

export function useResponsiveGrid(): GridConfig {
  const config = useResponsive();
  
  if (config.isMobile) {
    return {
      columns: 1,
      gap: 12,
      padding: 16,
      maxWidth: screenWidth,
    };
  }
  
  if (config.isTablet) {
    return {
      columns: config.isLandscape ? 3 : 2,
      gap: 16,
      padding: 24,
      maxWidth: 768,
    };
  }
  
  if (config.isDesktop) {
    return {
      columns: config.isUltraWide ? 4 : 3,
      gap: 20,
      padding: 32,
      maxWidth: 1024,
    };
  }
  
  // Large desktop
  return {
    columns: config.isUltraWide ? 6 : 4,
    gap: 24,
    padding: 40,
    maxWidth: 1280,
  };
}

// Sistema de tipografia responsiva
export interface TypographyConfig {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  body: number;
  caption: number;
  small: number;
}

export function useResponsiveTypography(): TypographyConfig {
  const config = useResponsive();
  
  const baseScale = config.isLargeDesktop ? 1.2 : config.isDesktop ? 1.1 : 1;
  const scaleFactor = baseScale * config.fontScale;
  
  return {
    h1: Math.round(32 * scaleFactor),
    h2: Math.round(24 * scaleFactor),
    h3: Math.round(20 * scaleFactor),
    h4: Math.round(18 * scaleFactor),
    body: Math.round(16 * scaleFactor),
    caption: Math.round(14 * scaleFactor),
    small: Math.round(12 * scaleFactor),
  };
}

// Sistema de espaçamento responsivo
export interface SpacingConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export function useResponsiveSpacing(): SpacingConfig {
  const config = useResponsive();
  const baseSpacing = config.isLargeDesktop ? 8 : config.isDesktop ? 6 : 4;
  const scaleFactor = config.isTablet ? 1.5 : config.isMobile ? 1 : 2;
  
  return {
    xs: baseSpacing,
    sm: baseSpacing * 2,
    md: baseSpacing * 3,
    lg: baseSpacing * 4,
    xl: baseSpacing * 5,
    xxl: baseSpacing * 6,
    xxxl: baseSpacing * 8,
  };
}

// Hook para animações responsivas
export interface AnimationConfig {
  duration: number;
  easing: string;
  scale: number;
}

export function useResponsiveAnimation(): AnimationConfig {
  const config = useResponsive();
  
  return {
    duration: config.isMobile ? 200 : config.isTablet ? 250 : 300,
    easing: config.isMobile ? 'ease-out' : 'ease-in-out',
    scale: config.isMobile ? 0.95 : config.isTablet ? 0.98 : 1,
  };
}

export default useResponsive;
