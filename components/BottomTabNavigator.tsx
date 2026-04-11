import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/utils/useAppTheme";
import { Package, History, Settings, Home, Camera } from "lucide-react-native";
import { advancedHaptics } from "@/utils/advancedHaptics";
import { useTabAnimation, useBasicAnimation } from "@/utils/animationUtils";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import ModernIcon from "./ModernIcon";

const { width: screenWidth } = Dimensions.get("window");

export type TabType = "home" | "scanner" | "history" | "settings";

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
    id: "home",
    label: "Início",
    icon: Home,
    activeIcon: Home,
  },
  {
    id: "scanner",
    label: "Scanner",
    icon: Camera,
    activeIcon: Camera,
  },
  {
    id: "history",
    label: "Histórico",
    icon: History,
    activeIcon: History,
  },
  {
    id: "settings",
    label: "Config",
    icon: Settings,
    activeIcon: Settings,
  },
];

export default function BottomTabNavigator({
  activeTab,
  onTabChange,
  showScannerTab = true,
}: BottomTabNavigatorProps) {
  const { colors, isDark } = useAppTheme();
  const translateX = useSharedValue(0);

  // Initialize animations for each tab - hooks must be called at component level
  const tabAnimations = tabs.reduce(
    (acc, tab) => {
      acc[tab.id] = useTabAnimation(false); // Initialize all as inactive
      return acc;
    },
    {} as Record<TabType, ReturnType<typeof useTabAnimation>>,
  );

  // Scale and rotation animations for modern effects
  const tabScales = tabs.reduce(
    (acc, tab) => {
      acc[tab.id] = useSharedValue(1);
      return acc;
    },
    {} as Record<TabType, any>,
  );

  const tabRotations = tabs.reduce(
    (acc, tab) => {
      acc[tab.id] = useSharedValue(0);
      return acc;
    },
    {} as Record<TabType, any>,
  );

  // Set initial active state and update when activeTab changes
  useEffect(() => {
    tabs.forEach((tab) => {
      if (activeTab === tab.id) {
        tabAnimations[tab.id].activate();
        // Modern scale and rotation animations for active tab
        tabScales[tab.id].value = withSequence(
          withTiming(1.2, { duration: 150 }),
          withSpring(1.05, { damping: 15, stiffness: 300 }),
        );
        tabRotations[tab.id].value = withSequence(
          withTiming(10, { duration: 150 }),
          withSpring(0, { damping: 15, stiffness: 300 }),
        );
      } else {
        tabAnimations[tab.id].deactivate();
        // Animate inactive tabs
        tabScales[activeTab].value = withSequence(
          withTiming(0.9, { duration: 100 }),
          withTiming(1, { duration: 100 }),
        );
        tabRotations[activeTab].value = withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(0, { duration: 100 }),
        );
      }
    });
  }, [activeTab]);

  const handleTabPress = useCallback(
    (tabId: TabType) => {
      if (tabId === activeTab) return;

      // Haptic feedback avançado
      advancedHaptics.onTabPress();

      // Animação de saída da tab atual
      tabAnimations[activeTab].deactivate();

      // Animação de entrada da nova tab
      tabAnimations[tabId].activate();

      onTabChange(tabId);
    },
    [activeTab, onTabChange, tabAnimations],
  );

  const getAnimatedTabStyle = (tabId: TabType) => {
    const scaleStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: tabScales[tabId].value },
          { rotate: `${tabRotations[tabId].value}deg` },
        ],
      };
    });
    return scaleStyle;
  };

  const getTabStyle = useCallback(
    (tabId: TabType) => {
      const isActive = activeTab === tabId;
      return {
        backgroundColor: "transparent",
        borderColor: isActive ? colors.primary : "transparent",
        borderWidth: isActive ? 2 : 0,
        shadowColor: isActive ? colors.primary : "transparent",
        shadowOpacity: isActive ? 0.2 : 0,
        elevation: isActive ? 6 : 0,
        transform: [{ scale: isActive ? 1.05 : 1 }],
      };
    },
    [activeTab, colors.primary],
  );

  const getIconColor = useCallback(
    (tabId: TabType) => {
      return activeTab === tabId ? colors.primary : colors.textMuted;
    },
    [activeTab, colors.primary, colors.textMuted],
  );

  const getTextColor = useCallback(
    (tabId: TabType) => {
      return activeTab === tabId ? colors.primary : colors.textMuted;
    },
    [activeTab, colors.primary, colors.textMuted],
  );

  const filteredTabs = useMemo(() => {
    return showScannerTab ? tabs : tabs.filter((tab) => tab.id !== "scanner");
  }, [showScannerTab]);

  const handleSwipeChangeTab = (direction: "left" | "right") => {
    const currentIndex = filteredTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex;
    if (direction === "left" && currentIndex < filteredTabs.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === "right" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }
    const nextTab = filteredTabs[nextIndex];
    if (nextTab && nextTab.id !== activeTab) {
      handleTabPress(nextTab.id);
    }
  };

  const onGestureEvent = (event: any) => {
    translateX.value = event.translationX;
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const swipeX = event.nativeEvent.translationX;
      if (Math.abs(swipeX) > 40) {
        if (swipeX < 0) {
          handleSwipeChangeTab("left");
        } else {
          handleSwipeChangeTab("right");
        }
      }
      translateX.value = withTiming(0, { duration: 150 });
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surface : colors.bg,
          borderTopColor: colors.border,
        },
      ]}
      edges={["bottom"]}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={styles.navContainer}>
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const tabAnimation = tabAnimations[tab.id];
            const animatedStyle = getAnimatedTabStyle(tab.id);

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, getTabStyle(tab.id)]}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.85}
              >
                <Animated.View
                  style={[tabAnimation.animatedStyle, animatedStyle]}
                >
                  <ModernIcon
                    icon={<Icon />}
                    size="md"
                    color={getIconColor(tab.id)}
                    animated={false}
                  />
                </Animated.View>

                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: getTextColor(tab.id),
                      fontWeight: activeTab === tab.id ? "700" : "500",
                      fontSize: activeTab === tab.id ? 11 : 10,
                    },
                    tabAnimation.animatedStyle,
                    animatedStyle,
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 4,
    paddingTop: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 10,
    minHeight: 40,
    minWidth: 50,
    maxWidth: 70,
    position: "relative",
    marginHorizontal: 1,
  },
  label: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 1,
    letterSpacing: 0.05,
    backgroundColor: "transparent",
    fontWeight: "500",
  },
});
