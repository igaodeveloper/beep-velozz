import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';

interface MainLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function MainLayout({ children, maxWidth = 640 }: MainLayoutProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  
  // Ajustar maxWidth baseado no dispositivo
  const adjustedMaxWidth = responsive.isTablet ? responsive.maxWidth.xl : 
                          responsive.isUltraWide ? responsive.maxWidth.lg :
                          responsive.maxWidth.md;
  const containerWidth = Math.min(responsive.screenWidth, adjustedMaxWidth);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          width: containerWidth,
          alignSelf: 'center',
          paddingHorizontal: responsive.isTablet ? responsive.padding.lg : responsive.padding.md,
        }}
      >
        {children}
      </View>
    </View>
  );
}
