import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
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
import * as Haptics from 'expo-haptics';

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
  const [animatedValues] = useState(() => 
    tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(activeTab === tab.id ? 1 : 0);
      return acc;
    }, {} as Record<TabType, Animated.Value>)
  );

  const handleTabPress = (tabId: TabType) => {
    if (tabId === activeTab) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate the previous tab to inactive
    Animated.timing(animatedValues[activeTab], {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Animate the new tab to active
    Animated.timing(animatedValues[tabId], {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    onTabChange(tabId);
  };

  const getTabStyle = (tabId: TabType) => {
    const isActive = activeTab === tabId;
    const animatedValue = animatedValues[tabId];

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
          const animatedValue = animatedValues[tab.id];
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, getTabStyle(tab.id)]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      {
                        scale: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.83, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <Icon
                    size={24}
                    color={getIconColor(tab.id)}
                    strokeWidth={activeTab === tab.id ? 2.5 : 2}
                  />
                </Animated.View>
              </Animated.View>
              
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: getTextColor(tab.id),
                    fontSize: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [11, 12],
                    }),
                    fontWeight: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['400', '600'],
                    }) as any,
                  },
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
