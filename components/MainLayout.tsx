import React from "react";
import { View, useWindowDimensions } from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { useResponsive } from "@/utils/useResponsive";
import HeaderNavigation, {
  HeaderVariant,
  HeaderSize,
} from "./HeaderNavigation";

interface MainLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerVariant?: HeaderVariant;
  headerSize?: HeaderSize;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onMorePress?: () => void;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showSearchButton?: boolean;
  showNotificationButton?: boolean;
  showMoreButton?: boolean;
  headerTransparent?: boolean;
  headerBlur?: boolean;
  scrollY?: any;
  notificationCount?: number;
}

export default function MainLayout({
  children,
  maxWidth = 640,
  showHeader = false,
  headerTitle,
  headerSubtitle,
  headerVariant = "default",
  headerSize = "md",
  onBackPress,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  onMorePress,
  showBackButton = false,
  showMenuButton = false,
  showSearchButton = false,
  showNotificationButton = false,
  showMoreButton = false,
  headerTransparent = false,
  headerBlur = false,
  scrollY,
  notificationCount = 0,
}: MainLayoutProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();

  // Ajustar maxWidth baseado no dispositivo
  const adjustedMaxWidth = responsive.isTablet
    ? responsive.maxWidth.xl
    : responsive.isUltraWide
      ? responsive.maxWidth.lg
      : responsive.maxWidth.md;
  const containerWidth = Math.min(responsive.screenWidth, adjustedMaxWidth);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          width: containerWidth,
          alignSelf: "center",
          paddingHorizontal: responsive.isTablet
            ? responsive.padding.lg
            : responsive.padding.md,
        }}
      >
        {showHeader && (
          <HeaderNavigation
            title={headerTitle}
            subtitle={headerSubtitle}
            variant={headerVariant}
            size={headerSize}
            onBackPress={onBackPress}
            onMenuPress={onMenuPress}
            onSearchPress={onSearchPress}
            onNotificationPress={onNotificationPress}
            onMorePress={onMorePress}
            showBackButton={showBackButton}
            showMenuButton={showMenuButton}
            showSearchButton={showSearchButton}
            showNotificationButton={showNotificationButton}
            showMoreButton={showMoreButton}
            transparent={headerTransparent}
            blur={headerBlur}
            scrollY={scrollY}
            notificationCount={notificationCount}
          />
        )}
        {children}
      </View>
    </View>
  );
}
