import React, { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/useAppTheme';
import BottomTabNavigator, { TabType } from './BottomTabNavigator';

const { height: screenHeight } = Dimensions.get('window');

interface TabLayoutProps {
  children: ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showScannerTab?: boolean;
}

export default function TabLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  showScannerTab = true 
}: TabLayoutProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { backgroundColor: colors.bg }
      ]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.content, { backgroundColor: colors.bg }]}>
        {children}
      </View>
      
      <BottomTabNavigator
        activeTab={activeTab}
        onTabChange={onTabChange}
        showScannerTab={showScannerTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for the bottom tab bar
  },
});
