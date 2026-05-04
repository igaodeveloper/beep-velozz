import { useMemo } from "react";
import { useWindowDimensions, Dimensions } from "react-native";

// Tipos de dispositivo
export type DeviceType = "phone" | "tablet" | "ultraWide" | "compact";

export interface ResponsiveConfig {
  deviceType: DeviceType;
  isTablet: boolean;
  isUltraWide: boolean;
  isCompact: boolean;
  isPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
  scale: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    xxxxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  padding: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  maxWidth: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    full: number;
  };
}

export function useResponsive(): ResponsiveConfig {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");

  const config = useMemo(() => {
    const aspectRatio =
      Math.max(screenWidth, screenHeight) / Math.min(screenWidth, screenHeight);
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);

    // Detectar tipo de dispositivo
    const isTablet =
      minDimension >= 768 || (aspectRatio < 1.3 && minDimension >= 600);
    const isUltraWide = aspectRatio > 2.0;
    const isCompact = minDimension < 360;
    const isPhone = !isTablet && !isUltraWide;

    let deviceType: DeviceType = "phone";
    if (isTablet) deviceType = "tablet";
    else if (isUltraWide) deviceType = "ultraWide";
    else if (isCompact) deviceType = "compact";

    // Scale factor baseado no tamanho
    const baseSize = 375; // iPhone base
    const scale = Math.max(0.8, Math.min(1.5, minDimension / baseSize));

    // Configurações responsivas
    const spacing = {
      xs: Math.round(4 * scale),
      sm: Math.round(8 * scale),
      md: Math.round(12 * scale),
      lg: Math.round(16 * scale),
      xl: Math.round(20 * scale),
      xxl: Math.round(24 * scale),
      xxxl: Math.round(32 * scale),
    };

    const fontSize = {
      xs: Math.round(10 * scale),
      sm: Math.round(12 * scale),
      md: Math.round(14 * scale),
      lg: Math.round(16 * scale),
      xl: Math.round(18 * scale),
      xxl: Math.round(20 * scale),
      xxxl: Math.round(24 * scale),
      xxxxl: Math.round(32 * scale),
    };

    const borderRadius = {
      sm: Math.round(6 * scale),
      md: Math.round(8 * scale),
      lg: Math.round(12 * scale),
      xl: Math.round(16 * scale),
      xxl: Math.round(20 * scale),
    };

    const padding = {
      xs: Math.round(8 * scale),
      sm: Math.round(12 * scale),
      md: Math.round(16 * scale),
      lg: Math.round(20 * scale),
      xl: Math.round(24 * scale),
      xxl: Math.round(32 * scale),
    };

    const maxWidth = {
      sm: Math.round(480 * scale),
      md: Math.round(640 * scale),
      lg: Math.round(768 * scale),
      xl: Math.round(1024 * scale),
      xxl: Math.round(1280 * scale),
      full: screenWidth,
    };

    return {
      deviceType,
      isTablet,
      isUltraWide,
      isCompact,
      isPhone,
      screenWidth,
      screenHeight,
      aspectRatio,
      scale,
      spacing,
      fontSize,
      borderRadius,
      padding,
      maxWidth,
    };
  }, [screenWidth, screenHeight, deviceWidth, deviceHeight]);

  return config;
}

// Helper functions para valores responsivos
export function responsiveValue<T>(
  responsive: ResponsiveConfig,
  values: Partial<Record<DeviceType, T>>,
  defaultValue: T,
): T {
  return values[responsive.deviceType] ?? defaultValue;
}

export function responsiveSize(
  responsive: ResponsiveConfig,
  phone: number,
  tablet?: number,
  ultraWide?: number,
  compact?: number,
): number {
  if (responsive.isTablet && tablet !== undefined) return tablet;
  if (responsive.isUltraWide && ultraWide !== undefined) return ultraWide;
  if (responsive.isCompact && compact !== undefined) return compact;
  return phone;
}
