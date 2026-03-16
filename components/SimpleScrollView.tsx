import React, { memo, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  RefreshControl,
  Platform,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useTheme } from '@/utils/themeContext';

interface SimpleScrollViewProps extends Omit<RNScrollViewProps, 'refreshControl'> {
  enableRefreshControl?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentContainerStyle?: ViewStyle;
  responsivePadding?: boolean;
}

const SimpleScrollView = memo(({
  children,
  enableRefreshControl = false,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  responsivePadding = true,
  style,
  ...rest
}: SimpleScrollViewProps) => {
  const { colors } = useAppTheme();
  const scrollViewRef = useRef<RNScrollView>(null);

  // Refresh control configuration
  const refreshControlComponent = useMemo(() => {
    if (enableRefreshControl && onRefresh) {
      return (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      );
    }
    return undefined;
  }, [enableRefreshControl, onRefresh, refreshing, colors]);

  // Content container style
  const contentStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      flexGrow: 1,
    };
    
    if (responsivePadding) {
      baseStyle.paddingHorizontal = 16;
      baseStyle.paddingBottom = 40;
    }
    
    return [baseStyle, contentContainerStyle];
  }, [responsivePadding, contentContainerStyle]);

  return (
    <RNScrollView
      ref={scrollViewRef}
      style={[
        styles.scrollView,
        { backgroundColor: colors.bg },
        style,
      ]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={true}
      refreshControl={refreshControlComponent}
      {...rest}
    >
      {children}
    </RNScrollView>
  );
});

SimpleScrollView.displayName = 'SimpleScrollView';

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default SimpleScrollView;
