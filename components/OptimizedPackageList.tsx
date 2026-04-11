/**
 * Optimized Package List Component
 * Componente de lista de pacotes otimizado com React.memo e virtualização
 */

import React, {
  memo,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { ScannedPackage } from "@/types/session";
import { getPackageTypeLabel } from "@/utils/scannerIdentification";
import {
  useOptimizedListAnimation,
  shouldAnimate,
} from "@/utils/performanceOptimizer";
import { debounce } from "@/utils/performanceOptimizer";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = Math.ceil(SCREEN_HEIGHT / ITEM_HEIGHT) + 2;

// Interface para a ref do componente
export interface OptimizedPackageListRef {
  scrollToItem: (packageId: string) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

interface OptimizedPackageListProps {
  packages: ScannedPackage[];
  onPackagePress?: (pkg: ScannedPackage) => void;
  onPackageLongPress?: (pkg: ScannedPackage) => void;
  highlightedPackageId?: string;
  showTypeColors?: boolean;
  compact?: boolean;
}

// Componente de item otimizado com memo
const PackageListItem = memo<{
  item: ScannedPackage;
  index: number;
  onPress?: (pkg: ScannedPackage) => void;
  onLongPress?: (pkg: ScannedPackage) => void;
  isHighlighted: boolean;
  showTypeColors: boolean;
  compact: boolean;
  colors: any;
  animatedValue: Animated.Value;
}>(
  ({
    item,
    index,
    onPress,
    onLongPress,
    isHighlighted,
    showTypeColors,
    compact,
    colors,
    animatedValue,
  }) => {
    const handlePress = useCallback(() => {
      onPress?.(item);
    }, [item, onPress]);

    const handleLongPress = useCallback(() => {
      onLongPress?.(item);
    }, [item, onLongPress]);

    // Animação de entrada otimizada
    const animatedStyle = useMemo(
      () => ({
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }),
      [animatedValue],
    );

    const typeColors = useMemo(
      () => ({
        shopee: "#FF6B6B",
        mercado_livre: "#4ECDC4",
        avulso: "#45B7D1",
        unknown: "#96CEB4",
      }),
      [],
    );

    const containerStyle = useMemo(
      () => [
        styles.itemContainer,
        {
          backgroundColor: isHighlighted
            ? colors.primary + "20"
            : colors.surface,
          borderColor: showTypeColors ? typeColors[item.type] : colors.border,
          borderLeftWidth: showTypeColors ? 4 : 1,
          height: compact ? 40 : ITEM_HEIGHT,
        },
        shouldAnimate() && animatedStyle,
      ],
      [
        isHighlighted,
        colors,
        showTypeColors,
        item.type,
        compact,
        animatedStyle,
      ],
    );

    const textStyle = useMemo(
      () => [
        styles.itemText,
        {
          color: colors.text,
          fontSize: compact ? 12 : 14,
        },
      ],
      [colors.text, compact],
    );

    const subTextStyle = useMemo(
      () => [
        styles.itemSubText,
        {
          color: colors.secondary,
          fontSize: compact ? 10 : 12,
        },
      ],
      [colors.secondary, compact],
    );

    return (
      <Animated.View style={containerStyle}>
        <View style={styles.itemContent}>
          <View style={styles.itemLeft}>
            <Text style={textStyle} numberOfLines={1}>
              {item.code}
            </Text>
            <Text style={subTextStyle} numberOfLines={1}>
              {getPackageTypeLabel(item.type)}
            </Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={[styles.itemValue, { color: colors.primary }]}>
              {item.value ? `R$ ${item.value.toFixed(2)}` : ""}
            </Text>
            <Text style={[styles.itemTime, { color: colors.secondary }]}>
              {new Date(item.scannedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  },
);

PackageListItem.displayName = "PackageListItem";

// Componente principal otimizado com forwardRef
const OptimizedPackageListComponent = forwardRef<
  OptimizedPackageListRef,
  OptimizedPackageListProps
>(
  (
    {
      packages,
      onPackagePress,
      onPackageLongPress,
      highlightedPackageId,
      showTypeColors = true,
      compact = false,
    },
    ref,
  ) => {
    const { colors } = useAppTheme();
    const flatListRef = useRef<FlatList>(null);
    const animatedValues = useRef<Animated.Value[]>([]);

    // Configuração de animação otimizada
    const { shouldUseStaggered, staggerDelay } = useOptimizedListAnimation(
      packages.length,
    );

    // Memoiza dados para evitar re-renders
    const memoizedPackages = useMemo(() => packages, [packages]);

    // Memoiza funções de callback
    const memoizedOnPress = useCallback(
      (pkg: ScannedPackage) => {
        onPackagePress?.(pkg);
      },
      [onPackagePress],
    );

    const memoizedOnLongPress = useCallback(
      (pkg: ScannedPackage) => {
        onPackageLongPress?.(pkg);
      },
      [onPackageLongPress],
    );

    // Debounce para scroll events
    const debouncedScroll = useMemo(
      () =>
        debounce((event: any) => {
          // Handle scroll events se necessário
        }, 16),
      [],
    );

    // Prepara valores animados
    useEffect(() => {
      animatedValues.current = packages.map(
        (_, index) => new Animated.Value(shouldUseStaggered ? 0 : 1),
      );

      if (shouldUseStaggered) {
        // Animação staggered
        const animations = animatedValues.current.map((value, index) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 300,
            delay: index * staggerDelay,
            useNativeDriver: true,
          }),
        );

        Animated.parallel(animations).start();
      }
    }, [packages.length, shouldUseStaggered, staggerDelay]);

    // Renderizador de item otimizado
    const renderItem = useCallback<ListRenderItem<ScannedPackage>>(
      ({ item, index }) => {
        const isHighlighted = item.id === highlightedPackageId;

        return (
          <PackageListItem
            item={item}
            index={index}
            onPress={memoizedOnPress}
            onLongPress={memoizedOnLongPress}
            isHighlighted={isHighlighted}
            showTypeColors={showTypeColors}
            compact={compact}
            colors={colors}
            animatedValue={
              animatedValues.current[index] || new Animated.Value(1)
            }
          />
        );
      },
      [
        memoizedOnPress,
        memoizedOnLongPress,
        highlightedPackageId,
        showTypeColors,
        compact,
        colors,
      ],
    );

    // Memoiza key extractor com fallback para garantir unicidade
    const keyExtractor = useCallback((item: ScannedPackage, index: number) => {
      // Usa ID do pacote + índice como fallback para garantir unicidade
      return `${item.id}-${index}`;
    }, []);

    // Memoiza getItemLayout para performance
    const getItemLayout = useCallback(
      (data: any, index: number) => ({
        length: compact ? 40 : ITEM_HEIGHT,
        offset: (compact ? 40 : ITEM_HEIGHT) * index,
        index,
      }),
      [compact],
    );

    // Memoiza component styles
    const containerStyle = useMemo(
      () => [styles.container, { backgroundColor: colors.bg }],
      [colors.bg],
    );

    // Função para scroll até item específico
    const scrollToItem = useCallback(
      (packageId: string) => {
        const index = packages.findIndex((pkg) => pkg.id === packageId);
        if (index !== -1 && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewOffset: 100,
          });
        }
      },
      [packages],
    );

    // Funções de scroll
    const scrollToTop = useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const scrollToBottom = useCallback(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, []);

    // Exposição de métodos via useImperativeHandle
    React.useImperativeHandle(
      ref,
      () => ({
        scrollToItem,
        scrollToTop,
        scrollToBottom,
      }),
      [scrollToItem, scrollToTop, scrollToBottom],
    );

    // Memoiza FlatList props
    const flatListProps = useMemo(
      () => ({
        ref: flatListRef,
        data: memoizedPackages,
        renderItem,
        keyExtractor,
        getItemLayout,
        windowSize: VISIBLE_ITEMS,
        initialNumToRender: Math.min(10, packages.length),
        maxToRenderPerBatch: 5,
        updateCellsBatchingPeriod: 50,
        removeClippedSubviews: true,
        onScroll: debouncedScroll,
        scrollEventThrottle: 16,
        showsVerticalScrollIndicator: false,
        contentContainerStyle: styles.listContent,
      }),
      [
        memoizedPackages,
        renderItem,
        keyExtractor,
        getItemLayout,
        debouncedScroll,
        packages.length,
      ],
    );

    return (
      <View style={containerStyle}>
        <FlatList {...flatListProps} />
      </View>
    );
  },
);

// Export com memo
const OptimizedPackageList = memo(OptimizedPackageListComponent);
OptimizedPackageList.displayName = "OptimizedPackageList";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemText: {
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSubText: {
    fontSize: 12,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 10,
  },
});

export default OptimizedPackageList;
