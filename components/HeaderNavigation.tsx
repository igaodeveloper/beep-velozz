import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';
import {
  ChevronLeft,
  Menu,
  Bell,
  Search,
  MoreVertical,
  User,
  Settings,
  Filter,
  Plus,
} from 'lucide-react-native';
import ModernIcon from './ModernIcon';
import * as Haptics from 'expo-haptics';

export type HeaderVariant = 'default' | 'centered' | 'search' | 'profile' | 'settings';
export type HeaderSize = 'sm' | 'md' | 'lg';

interface HeaderNavigationProps {
  title?: string;
  subtitle?: string;
  variant?: HeaderVariant;
  size?: HeaderSize;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onMorePress?: () => void;
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onFilterPress?: () => void;
  onAddPress?: () => void;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showSearchButton?: boolean;
  showNotificationButton?: boolean;
  showMoreButton?: boolean;
  showProfileButton?: boolean;
  showSettingsButton?: boolean;
  showFilterButton?: boolean;
  showAddButton?: boolean;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  centerComponent?: React.ReactNode;
  transparent?: boolean;
  blur?: boolean;
  animated?: boolean;
  scrollY?: Animated.Value;
  notificationCount?: number;
}

export default function HeaderNavigation({
  title,
  subtitle,
  variant = 'default',
  size = 'md',
  onBackPress,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  onMorePress,
  onProfilePress,
  onSettingsPress,
  onFilterPress,
  onAddPress,
  showBackButton = false,
  showMenuButton = false,
  showSearchButton = false,
  showNotificationButton = false,
  showMoreButton = false,
  showProfileButton = false,
  showSettingsButton = false,
  showFilterButton = false,
  showAddButton = false,
  rightComponent,
  leftComponent,
  centerComponent,
  transparent = false,
  blur = false,
  animated = true,
  scrollY,
  notificationCount = 0,
}: HeaderNavigationProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && scrollY) {
      const listenerId = scrollY.addListener(({ value }) => {
        const opacity = Math.max(0.3, 1 - value / 100);
        const translateY = Math.min(0, value / 2);

        Animated.timing(opacityAnim, {
          toValue: opacity,
          duration: 0,
          useNativeDriver: true,
        }).start();

        Animated.timing(translateYAnim, {
          toValue: translateY,
          duration: 0,
          useNativeDriver: true,
        }).start();
      });

      return () => scrollY.removeListener(listenerId);
    }
  }, [animated, scrollY]);

  const handleButtonPress = (callback?: () => void) => {
    if (callback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      callback();
    }
  };

  const getHeaderHeight = (): number => {
    const sizeMap = {
      sm: responsive.isTablet ? 56 : 48,
      md: responsive.isTablet ? 64 : 56,
      lg: responsive.isTablet ? 72 : 64,
    };
    return sizeMap[size];
  };

  const getBorderRadius = (): number => {
    const radiusMap = {
      sm: responsive.isTablet ? 20 : 16,
      md: responsive.isTablet ? 24 : 20,
      lg: responsive.isTablet ? 28 : 24,
    };
    return radiusMap[size];
  };

  const getFontSize = (): { title: number; subtitle: number } => {
    const sizeMap = {
      sm: { title: 18, subtitle: 12 },
      md: { title: 20, subtitle: 13 },
      lg: { title: 22, subtitle: 14 },
    };
    return sizeMap[size];
  };

  const animatedStyle = animated
    ? {
        opacity: scrollY ? opacityAnim : 1,
        transform: [{ translateY: scrollY ? translateYAnim : 0 }],
      }
    : {};

  const getHeaderStyle = () => {
    const baseStyle = {
      height: getHeaderHeight(),
      backgroundColor: transparent ? 'transparent' : colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: transparent ? 0 : 1,
      borderRadius: getBorderRadius(),
      marginHorizontal: responsive.isTablet ? 24 : 16,
      marginTop: responsive.isTablet ? 24 : 16,
      marginBottom: responsive.isTablet ? 16 : 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    };

    if (blur) {
      return {
        ...baseStyle,
        backgroundColor: colors.surface + '80',
        backdropFilter: 'blur(20px)',
      };
    }

    return baseStyle;
  };

  const renderLeftContent = () => {
    if (leftComponent) {
      return leftComponent;
    }

    const buttons = [];
    
    if (showBackButton) {
      buttons.push(
        <ModernIcon
          key="back"
          icon={<ChevronLeft />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onBackPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showMenuButton) {
      buttons.push(
        <ModernIcon
          key="menu"
          icon={<Menu />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onMenuPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showProfileButton) {
      buttons.push(
        <ModernIcon
          key="profile"
          icon={<User />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onProfilePress)}
          hapticFeedback={true}
        />
      );
    }

    return <View style={styles.leftContent}>{buttons}</View>;
  };

  const renderNotificationButton = () => {
    if (!showNotificationButton) return null;

    return (
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => handleButtonPress(onNotificationPress)}
        activeOpacity={0.7}
      >
        <ModernIcon
          icon={<Bell />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onNotificationPress)}
          hapticFeedback={true}
        />
        {notificationCount > 0 && (
          <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]}>
            <Text style={[styles.notificationCount, { color: '#ffffff' }]}>
              {notificationCount > 99 ? '99+' : notificationCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCenterContent = () => {
    if (centerComponent) {
      return centerComponent;
    }

    // Sem título ou subtítulo - header compacto
    return null;
  };

  const renderRightContent = () => {
    if (rightComponent) {
      return rightComponent;
    }

    const buttons = [];

    if (showSearchButton) {
      buttons.push(
        <ModernIcon
          key="search"
          icon={<Search />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onSearchPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showNotificationButton) {
      buttons.push(renderNotificationButton());
    }

    if (showFilterButton) {
      buttons.push(
        <ModernIcon
          key="filter"
          icon={<Filter />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onFilterPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showAddButton) {
      buttons.push(
        <ModernIcon
          key="add"
          icon={<Plus />}
          size="md"
          color={colors.primary}
          onPress={() => handleButtonPress(onAddPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showSettingsButton) {
      buttons.push(
        <ModernIcon
          key="settings"
          icon={<Settings />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onSettingsPress)}
          hapticFeedback={true}
        />
      );
    }

    if (showMoreButton) {
      buttons.push(
        <ModernIcon
          key="more"
          icon={<MoreVertical />}
          size="md"
          color={colors.text}
          onPress={() => handleButtonPress(onMorePress)}
          hapticFeedback={true}
        />
      );
    }

    return <View style={styles.rightContent}>{buttons}</View>;
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={colors.bg === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={transparent ? 'transparent' : colors.surface}
        translucent={transparent}
      />
      <Animated.View style={[getHeaderStyle(), animatedStyle]}>
        <View style={styles.headerContent}>
          {renderLeftContent()}
          {renderCenterContent()}
          {renderRightContent()}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
