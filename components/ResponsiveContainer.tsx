import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  centerContent?: boolean;
  padding?: {
    phone?: number;
    tablet?: number;
    portrait?: number;
    landscape?: number;
    default: number;
  };
  margin?: {
    phone?: number;
    tablet?: number;
    portrait?: number;
    landscape?: number;
    default: number;
  };
}

export function ResponsiveContainer({
  children,
  style,
  maxWidth,
  centerContent = true,
  padding,
  margin,
}: ResponsiveContainerProps) {
  const deviceInfo = useResponsiveLayout();

  const getPadding = () => {
    if (!padding) return 16;
    
    if (deviceInfo.isTablet && padding.tablet !== undefined) {
      return padding.tablet;
    }
    
    if (deviceInfo.isLandscape && padding.landscape !== undefined) {
      return padding.landscape;
    }
    
    if (deviceInfo.isPortrait && padding.portrait !== undefined) {
      return padding.portrait;
    }
    
    if (deviceInfo.isPhone && padding.phone !== undefined) {
      return padding.phone;
    }
    
    return padding.default;
  };

  const getMargin = () => {
    if (!margin) return 0;
    
    if (deviceInfo.isTablet && margin.tablet !== undefined) {
      return margin.tablet;
    }
    
    if (deviceInfo.isLandscape && margin.landscape !== undefined) {
      return margin.landscape;
    }
    
    if (deviceInfo.isPortrait && margin.portrait !== undefined) {
      return margin.portrait;
    }
    
    if (deviceInfo.isPhone && margin.phone !== undefined) {
      return margin.phone;
    }
    
    return margin.default;
  };

  const getMaxWidth = () => {
    if (maxWidth) return maxWidth;
    
    if (deviceInfo.isTablet) {
      if (deviceInfo.isLandscape) {
        return deviceInfo.screenSize.width * 0.8;
      } else {
        return deviceInfo.screenSize.width * 0.9;
      }
    }
    
    return deviceInfo.screenSize.width * 0.95;
  };

  const containerStyle: ViewStyle = {
    maxWidth: getMaxWidth(),
    width: '100%',
    padding: getPadding(),
    margin: getMargin(),
    ...(centerContent && {
      alignSelf: 'center',
      alignItems: 'center',
    }),
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ResponsiveContainer;
