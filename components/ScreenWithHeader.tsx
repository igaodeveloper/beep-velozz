import React, { useRef } from 'react';
import { Animated } from 'react-native';
import MainLayout from './MainLayout';
import { HeaderVariant, HeaderSize } from './HeaderNavigation';

interface ScreenWithHeaderProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: HeaderVariant;
  size?: HeaderSize;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showSearchButton?: boolean;
  showNotificationButton?: boolean;
  showMoreButton?: boolean;
  showSettingsButton?: boolean;
  showFilterButton?: boolean;
  showAddButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onMorePress?: () => void;
  onSettingsPress?: () => void;
  onFilterPress?: () => void;
  onAddPress?: () => void;
  headerTransparent?: boolean;
  headerBlur?: boolean;
}

export default function ScreenWithHeader({
  children,
  title,
  subtitle,
  variant = 'default',
  size = 'md',
  showBackButton = false,
  showMenuButton = false,
  showSearchButton = false,
  showNotificationButton = false,
  showMoreButton = false,
  showSettingsButton = false,
  showFilterButton = false,
  showAddButton = false,
  onBackPress,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  onMorePress,
  onSettingsPress,
  onFilterPress,
  onAddPress,
  headerTransparent = false,
  headerBlur = false,
}: ScreenWithHeaderProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <MainLayout
      showHeader={true}
      headerTitle={title}
      headerSubtitle={subtitle}
      headerVariant={variant}
      headerSize={size}
      showBackButton={showBackButton}
      showMenuButton={showMenuButton}
      showSearchButton={showSearchButton}
      showNotificationButton={showNotificationButton}
      showMoreButton={showMoreButton}
      onBackPress={onBackPress}
      onMenuPress={onMenuPress}
      onSearchPress={onSearchPress}
      onNotificationPress={onNotificationPress}
      onMorePress={onMorePress}
      headerTransparent={headerTransparent}
      headerBlur={headerBlur}
      scrollY={scrollY}
    >
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {children}
      </Animated.ScrollView>
    </MainLayout>
  );
}

// Exemplos de uso:
export const HomeHeaderExample = ({ children }: { children: React.ReactNode }) => (
  <ScreenWithHeader
    title="Beep Velozz"
    subtitle="Sistema de scanner industrial"
    variant="centered"
    size="lg"
    showMenuButton={true}
    showSearchButton={true}
    showNotificationButton={true}
    showMoreButton={true}
    headerBlur={true}
  >
    {children}
  </ScreenWithHeader>
);

export const SettingsHeaderExample = ({ children }: { children: React.ReactNode }) => (
  <ScreenWithHeader
    title="Configurações"
    subtitle="Personalize sua experiência"
    variant="default"
    size="lg"
    showBackButton={true}
    showSearchButton={true}
    showMoreButton={true}
    headerBlur={true}
  >
    {children}
  </ScreenWithHeader>
);

export const ScannerHeaderExample = ({ children }: { children: React.ReactNode }) => (
  <ScreenWithHeader
    title="Scanner"
    subtitle="Aponte para a câmera"
    variant="default"
    size="md"
    showBackButton={true}
    showSettingsButton={true}
    showFilterButton={true}
    showAddButton={true}
    headerBlur={true}
  >
    {children}
  </ScreenWithHeader>
);

export const ProfileHeaderExample = ({ children }: { children: React.ReactNode }) => (
  <ScreenWithHeader
    title="Perfil"
    subtitle="Suas informações"
    variant="profile"
    size="lg"
    showBackButton={true}
    showSettingsButton={true}
    showMoreButton={true}
    headerBlur={true}
  >
    {children}
  </ScreenWithHeader>
);

export const SearchHeaderExample = ({ children }: { children: React.ReactNode }) => (
  <ScreenWithHeader
    title="Buscar"
    subtitle="Encontre pacotes rapidamente"
    variant="search"
    size="md"
    showBackButton={true}
    showFilterButton={true}
    showMoreButton={true}
    headerBlur={true}
  >
    {children}
  </ScreenWithHeader>
);
