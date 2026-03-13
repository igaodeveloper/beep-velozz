import { Dimensions, Platform } from 'react-native';

export type Orientation = 'portrait' | 'landscape' | 'square';

export interface ScreenSize {
  width: number;
  height: number;
}

export interface DeviceInfo {
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  isTablet: boolean;
  isPhone: boolean;
  screenSize: ScreenSize;
  aspectRatio: number;
}

export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  
  const isLandscape = width > height;
  const isPortrait = height > width;
  const isSquare = Math.abs(width - height) < 50;
  
  const isTablet = Platform.OS === 'ios' 
    ? width >= 768 || height >= 768
    : width >= 600 || height >= 600;
  
  const isPhone = !isTablet;
  
  let orientation: Orientation = 'portrait';
  if (isLandscape) orientation = 'landscape';
  else if (isSquare) orientation = 'square';
  
  return {
    orientation,
    isLandscape,
    isPortrait,
    isTablet,
    isPhone,
    screenSize: { width, height },
    aspectRatio,
  };
};

export const getResponsiveValue = <T>(
  values: {
    phone?: T;
    tablet?: T;
    portrait?: T;
    landscape?: T;
    default: T;
  }
): T => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  
  if (deviceInfo.isLandscape && values.landscape !== undefined) {
    return values.landscape;
  }
  
  if (deviceInfo.isPortrait && values.portrait !== undefined) {
    return values.portrait;
  }
  
  if (deviceInfo.isPhone && values.phone !== undefined) {
    return values.phone;
  }
  
  return values.default;
};

export const getFontSize = (baseSize: number): number => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isTablet) {
    return baseSize * 1.2;
  }
  
  if (deviceInfo.isLandscape) {
    return baseSize * 0.9;
  }
  
  return baseSize;
};

export const getSpacing = (baseSpacing: number): number => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isTablet) {
    return baseSpacing * 1.5;
  }
  
  if (deviceInfo.isLandscape) {
    return baseSpacing * 0.8;
  }
  
  return baseSpacing;
};

export const getMaxContentWidth = (): number => {
  const deviceInfo = getDeviceInfo();
  const { width } = deviceInfo.screenSize;
  
  if (deviceInfo.isTablet) {
    if (deviceInfo.isLandscape) {
      return Math.min(width * 0.7, 1200);
    } else {
      return Math.min(width * 0.85, 800);
    }
  }
  
  return width * 0.95;
};

export const getColumnsCount = (
  minItemWidth: number,
  maxColumns?: number
): number => {
  const deviceInfo = getDeviceInfo();
  const { width } = deviceInfo.screenSize;
  const maxContentWidth = getMaxContentWidth();
  
  const calculatedColumns = Math.floor(maxContentWidth / minItemWidth);
  
  if (maxColumns) {
    return Math.min(calculatedColumns, maxColumns);
  }
  
  return Math.max(calculatedColumns, 1);
};

export const shouldUseLandscapeLayout = (componentType?: string): boolean => {
  const deviceInfo = getDeviceInfo();
  
  if (!deviceInfo.isLandscape) {
    return false;
  }
  
  switch (componentType) {
    case 'scanner':
    case 'camera':
    case 'video':
      return true;
    case 'form':
    case 'note':
      return deviceInfo.isTablet;
    case 'list':
    case 'grid':
      return deviceInfo.isTablet;
    default:
      return deviceInfo.isTablet;
  }
};

export const getResponsiveStyles = <T extends Record<string, any>>(
  baseStyles: T,
  responsiveOverrides?: {
    tablet?: Partial<T>;
    landscape?: Partial<T>;
    portrait?: Partial<T>;
  }
): T => {
  const deviceInfo = getDeviceInfo();
  let finalStyles = { ...baseStyles };
  
  if (deviceInfo.isTablet && responsiveOverrides?.tablet) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.tablet };
  }
  
  if (deviceInfo.isLandscape && responsiveOverrides?.landscape) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.landscape };
  }
  
  if (deviceInfo.isPortrait && responsiveOverrides?.portrait) {
    finalStyles = { ...finalStyles, ...responsiveOverrides.portrait };
  }
  
  return finalStyles;
};
