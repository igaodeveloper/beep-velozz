import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';

interface MainLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function MainLayout({ children, maxWidth = 640 }: MainLayoutProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width, maxWidth);

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
        }}
      >
        {children}
      </View>
    </View>
  );
}
