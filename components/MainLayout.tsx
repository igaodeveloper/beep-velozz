import React, { memo, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';

interface MainLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default memo(function MainLayout({ children, maxWidth = 640 }: MainLayoutProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  
  const adjustedMaxWidth = useMemo(() => {
    return responsive.isTablet ? responsive.maxWidth.xl : 
           responsive.isUltraWide ? responsive.maxWidth.lg :
           responsive.maxWidth.md;
  }, [responsive.isTablet, responsive.isUltraWide, responsive.maxWidth]);
  
  const containerWidth = useMemo(() => {
    return Math.min(responsive.screenWidth, adjustedMaxWidth);
  }, [responsive.screenWidth, adjustedMaxWidth]);
  
  const containerStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: colors.bg,
  }), [colors.bg]);
  
  const innerContainerStyle = useMemo(() => ({
    flex: 1,
    width: containerWidth,
    alignSelf: 'center' as const,
    paddingHorizontal: responsive.isTablet ? responsive.padding.lg : responsive.padding.md,
  }), [containerWidth, responsive.isTablet, responsive.padding]);

  return (
    <View style={containerStyle}>
      <View style={innerContainerStyle}>
        {children}
      </View>
    </View>
  );
});
