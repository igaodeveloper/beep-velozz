import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  FlatList as RNFlatList,
  FlatListProps as RNFlatListProps,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';

interface OptimizedFlatListProps<T> extends Omit<RNFlatListProps<T>, 'renderItem' | 'refreshControl'> {
  data: T[];
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement;
  itemHeight?: number;
  estimatedItemSize?: number;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
  onEndReachedThreshold?: number;
  onEndReached?: () => void;
  loading?: boolean;
  loadingMore?: boolean;
  emptyText?: string;
  emptyComponent?: React.ReactElement;
  headerComponent?: React.ReactElement;
  footerComponent?: React.ReactElement;
  refreshControl?: React.ReactElement;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
}

const EmptyComponent = memo(({ text, customComponent }: { text?: string; customComponent?: React.ReactElement }) => {
  if (customComponent) {
    return customComponent;
  }
  
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{text || 'Nenhum item encontrado'}</Text>
    </View>
  );
});

EmptyComponent.displayName = 'EmptyComponent';

const LoadingFooter = memo(({ loading }: { loading: boolean }) => {
  if (!loading) return null;
  
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#007AFF" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
});

LoadingFooter.displayName = 'LoadingFooter';

function OptimizedFlatList<T>({
  data,
  renderItem,
  itemHeight,
  estimatedItemSize = 50,
  getItemLayout,
  onEndReachedThreshold = 0.5,
  onEndReached,
  loading = false,
  loadingMore = false,
  emptyText,
  emptyComponent,
  headerComponent,
  footerComponent,
  refreshControl,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  initialNumToRender = 15,
  windowSize = 21,
  removeClippedSubviews = true,
  ...rest
}: OptimizedFlatListProps<T>) {
  const flatListRef = useRef<RNFlatList<T>>(null);

  // Memoize the getItemLayout prop if itemHeight is provided
  const memoizedGetItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    if (itemHeight) {
      return (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [getItemLayout, itemHeight]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: T, index: number) => {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as any).id);
    }
    return String(index);
  }, []);

  // Memoize the render item function
  const memoizedRenderItem = useCallback(renderItem, [renderItem]);

  // Memoize ListHeaderComponent
  const ListHeaderComponent = useMemo(() => headerComponent, [headerComponent]);

  // Memoize ListFooterComponent
  const ListFooterComponent = useMemo(() => {
    if (loadingMore) {
      return <LoadingFooter loading={true} />;
    }
    return footerComponent;
  }, [loadingMore, footerComponent]);

  // Memoize ListEmptyComponent
  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return <LoadingFooter loading={true} />;
    }
    return <EmptyComponent text={emptyText} customComponent={emptyComponent} />;
  }, [loading, emptyText, emptyComponent]);

  // Optimized onEndReached with debouncing
  const debouncedOnEndReached = useCallback(() => {
    if (onEndReached && !loading && !loadingMore) {
      onEndReached();
    }
  }, [onEndReached, loading, loadingMore]);

  // Scroll to top method
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Performance optimizations
  const optimizedProps = useMemo(() => ({
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    initialNumToRender,
    windowSize,
    removeClippedSubviews,
    onEndReachedThreshold,
    keyExtractor,
    getItemLayout: memoizedGetItemLayout,
    onEndReached: debouncedOnEndReached,
  }), [
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    initialNumToRender,
    windowSize,
    removeClippedSubviews,
    onEndReachedThreshold,
    keyExtractor,
    memoizedGetItemLayout,
    debouncedOnEndReached,
  ]);

  return (
    <RNFlatList
      ref={flatListRef}
      data={data}
      renderItem={memoizedRenderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      {...optimizedProps}
      {...rest}
      style={[styles.container, rest.style]}
      contentContainerStyle={[styles.contentContainer, rest.contentContainerStyle]}
      refreshControl={refreshControl as any}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default memo(OptimizedFlatList) as typeof OptimizedFlatList;
