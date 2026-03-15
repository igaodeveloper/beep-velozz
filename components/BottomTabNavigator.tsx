import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/useAppTheme';
import { 
  Package, 
  BarChart3, 
  History, 
  Settings,
  Home,
  Camera
} from 'lucide-react-native';
import { advancedHaptics } from '@/utils/advancedHaptics';
import { useTabAnimation, useBasicAnimation } from '@/utils/animationUtils';

const { width: screenWidth } = Dimensions.get('window');

export type TabType = 'home' | 'scanner' | 'analytics' | 'history' | 'settings';

interface TabItem {
  id: TabType;
  label: string;
  icon: any;
  activeIcon: any;
}

interface BottomTabNavigatorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showScannerTab?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'home',
    label: 'Início',
    icon: Home,
    activeIcon: Home,
  },
  {
    id: 'scanner',
    label: 'Scanner',
    icon: Camera,
    activeIcon: Camera,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    activeIcon: BarChart3,
  },
  {
    id: 'history',
    label: 'Histórico',
    icon: History,
    activeIcon: History,
  },
  {
    id: 'settings',
    label: 'Config',
    icon: Settings,
    activeIcon: Settings,
  },
];

export default function BottomTabNavigator({ 
  activeTab, 
  onTabChange, 
  showScannerTab = true 
}: BottomTabNavigatorProps) {
  const { colors, isDark } = useAppTheme();
  
  // Initialize animations for each tab - hooks must be called at component level
  const tabAnimations = tabs.reduce((acc, tab) => {
    acc[tab.id] = useTabAnimation(false); // Initialize all as inactive
    return acc;
  }, {} as Record<TabType, ReturnType<typeof useTabAnimation>>);

  // Set initial active state and update when activeTab changes
  useEffect(() => {
    tabs.forEach(tab => {
      if (activeTab === tab.id) {
        tabAnimations[tab.id].activate();
      } else {
        tabAnimations[tab.id].deactivate();
      }
    });
  }, [activeTab]);

  const handleTabPress = (tabId: TabType) => {
    if (tabId === activeTab) return;

    // Haptic feedback avançado
    advancedHaptics.onTabPress();

    // Animação de saída da tab atual
    tabAnimations[activeTab].deactivate();

    // Animação de entrada da nova tab
    tabAnimations[tabId].activate();

    onTabChange(tabId);
  };

  const getTabStyle = (tabId: TabType) => {
    const isActive = activeTab === tabId;

    return {
      backgroundColor: isActive ? colors.primary + '15' : 'transparent',
      borderTopColor: isActive ? colors.primary : 'transparent',
    };
  };

  const getIconColor = (tabId: TabType) => {
    const isActive = activeTab === tabId;
    return isActive ? colors.primary : colors.textMuted;
  };

  const getTextColor = (tabId: TabType) => {
    const isActive = activeTab === tabId;
    return isActive ? colors.primary : colors.textMuted;
  };

  const filteredTabs = showScannerTab ? tabs : tabs.filter(tab => tab.id !== 'scanner');

  return (
    <SafeAreaView 
      style={[
        styles.container,
        { 
          backgroundColor: isDark ? colors.surface : colors.bg,
          borderTopColor: colors.border,
        }
      ]}
      edges={['bottom']}
    >
      <View style={styles.navContainer}>
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const tabAnimation = tabAnimations[tab.id];
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, getTabStyle(tab.id)]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Animated.View style={tabAnimation.animatedStyle}>
                <Icon
                  size={24}
                  color={getIconColor(tab.id)}
                  strokeWidth={activeTab === tab.id ? 2.5 : 2}
                />
              </Animated.View>
              
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: getTextColor(tab.id),
                  },
                  tabAnimation.animatedStyle,
                ]}
              >
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
    paddingTop: 8,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderTopWidth: 2,
    minHeight: 60,
    position: 'relative',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
