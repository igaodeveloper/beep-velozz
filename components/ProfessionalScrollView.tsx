import React, { memo, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  RefreshControl,
  Platform,
  StyleSheet,
  ViewStyle,
  Animated,
  View,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useTheme } from '@/utils/themeContext';
import { useResponsive } from '@/hooks/useResponsiveAdvanced';

interface ProfessionalScrollViewProps extends Omit<RNScrollViewProps, 'refreshControl'> {
  // Enhanced scroll features
  enableRefreshControl?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  
  // Professional styling
  contentContainerStyle?: ViewStyle;
  showScrollIndicator?: boolean;
  scrollIndicatorInsets?: { top?: number; left?: number; bottom?: number; right?: number };
  
  // Performance optimizations
  disableScrollViewPanResponder?: boolean;
  nestedScrollEnabled?: boolean;
  scrollEventThrottle?: number;
  
  // Responsive behavior
  responsivePadding?: boolean;
  maxWidth?: number;
  centered?: boolean;
  
  // Advanced features
  stickyHeader?: React.ReactElement;
  stickyHeaderHeight?: number;
  fadeEdges?: boolean;
  snapToOffsets?: number[];
}

const ProfessionalScrollView = memo(({
  children,
  enableRefreshControl = false,
  onRefresh,
  refreshing = false,
  contentContainerStyle,
  showScrollIndicator = true,
  scrollIndicatorInsets,
  disableScrollViewPanResponder = false,
  nestedScrollEnabled = true,
  scrollEventThrottle = 16,
  responsivePadding = true,
  maxWidth,
  centered = false,
  stickyHeader,
  stickyHeaderHeight = 60,
  fadeEdges = false,
  snapToOffsets,
  style,
  ...rest
}: ProfessionalScrollViewProps) => {
  const { colors } = useAppTheme();
  const { isDark } = useTheme();
  const responsive = useResponsive();
  const scrollViewRef = useRef<RNScrollView>(null);
  const fadeOpacity = useRef(new Animated.Value(0)).current;
  
  // Responsive content container style
  const responsiveContentStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      flexGrow: 1,
    };
    
    if (responsivePadding) {
      baseStyle.paddingHorizontal = responsive.isMobile ? 16 : 
                                   responsive.isTablet ? 24 : 32;
      baseStyle.paddingBottom = responsive.isMobile ? 40 : 60; // Aumentado para garantir scroll
    }
    
    if (centered) {
      baseStyle.alignItems = 'center';
      if (maxWidth) {
        baseStyle.width = '100%';
        baseStyle.maxWidth = maxWidth;
      }
    }
    
    return [baseStyle, contentContainerStyle];
  }, [responsivePadding, centered, maxWidth, contentContainerStyle, responsive]);
  
  // Scroll indicator styling
  const scrollIndicatorStyle = useMemo(() => {
    if (Platform.OS === 'ios') {
      return {
        indicatorStyle: isDark ? 'white' as const : 'black' as const,
        scrollIndicatorInsets: scrollIndicatorInsets || {
          top: stickyHeader ? stickyHeaderHeight : 0,
        },
      };
    }
    return {};
  }, [isDark, scrollIndicatorInsets, stickyHeader, stickyHeaderHeight]);
  
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
  
  // Fade edges animation
  const handleScroll = useCallback((event: any) => {
    if (fadeEdges && Platform.OS === 'ios') {
      const { y } = event.nativeEvent.contentOffset;
      const fadeValue = Math.min(y / 100, 1);
      Animated.timing(fadeOpacity, {
        toValue: fadeValue,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeEdges, fadeOpacity]);
  
  // Scroll methods
  const scrollToTop = useCallback((animated = true) => {
    scrollViewRef.current?.scrollTo({ y: 0, animated });
  }, []);
  
  const scrollToOffset = useCallback((offset: number, animated = true) => {
    scrollViewRef.current?.scrollTo({ y: offset, animated });
  }, []);
  
  // Expose methods through ref
  React.useImperativeHandle((rest as any).forwardRef, () => ({
    scrollToTop,
    scrollToOffset,
    getScrollView: () => scrollViewRef.current,
  }));
  
  return (
    <View style={[styles.container, style]}>
      {/* Sticky Header */}
      {stickyHeader && (
        <View style={[styles.stickyHeader, { height: stickyHeaderHeight }]}>
          {stickyHeader}
        </View>
      )}
      
      {/* Main ScrollView */}
      <RNScrollView
        ref={scrollViewRef}
        style={[
          styles.scrollView,
          { backgroundColor: colors.bg },
          !showScrollIndicator && styles.hideScrollIndicator,
        ]}
        contentContainerStyle={responsiveContentStyle}
        showsVerticalScrollIndicator={showScrollIndicator}
        {...scrollIndicatorStyle}
        refreshControl={refreshControlComponent}
        onScroll={fadeEdges ? handleScroll : undefined}
        scrollEventThrottle={fadeEdges ? 16 : scrollEventThrottle}
        disableScrollViewPanResponder={disableScrollViewPanResponder}
        nestedScrollEnabled={nestedScrollEnabled}
        snapToOffsets={snapToOffsets}
        snapToEnd={!!snapToOffsets}
        {...rest}
      >
        {/* Fade Edge Top */}
        {fadeEdges && Platform.OS === 'ios' && (
          <Animated.View
            style={[
              styles.fadeEdgeTop,
              {
                opacity: fadeOpacity,
                backgroundColor: colors.bg,
              },
            ]}
            pointerEvents="none"
          />
        )}
        
        {children}
        
        {/* Fade Edge Bottom */}
        {fadeEdges && Platform.OS === 'ios' && (
          <Animated.View
            style={[
              styles.fadeEdgeBottom,
              {
                opacity: Animated.subtract(1, fadeOpacity),
                backgroundColor: colors.bg,
              },
            ]}
            pointerEvents="none"
          />
        )}
      </RNScrollView>
    </View>
  );
});

ProfessionalScrollView.displayName = 'ProfessionalScrollView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  hideScrollIndicator: {
    opacity: 0,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4,
  },
  fadeEdgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 999,
  },
  fadeEdgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 999,
  },
});

export default ProfessionalScrollView;
