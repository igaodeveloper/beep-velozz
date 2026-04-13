// src/utils/listOptimization.ts
/**
 * List rendering optimization utilities
 * Implements virtualization, memoization, and lazy loading
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { FlatList, FlatListProps, ViewToken } from 'react-native';

export interface OptimizedListConfig {
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  windowSize?: number;
  enableVirtualization?: boolean;
  disableVirtualization?: boolean;
}

export const DEFAULT_FLAT_LIST_CONFIG: OptimizedListConfig = {
  initialNumToRender: 20, // Render first 20 items
  maxToRenderPerBatch: 10, // Add 10 at a time
  updateCellsBatchingPeriod: 50, // Update every 50ms
  removeClippedSubviews: true, // Remove off-screen items from memory
  windowSize: 21, // Render 10 items above + current + 10 items below
  enableVirtualization: true,
};

/**
 * Hook for optimized list rendering
 * Handles sorting, filtering, memoization
 */
export const useOptimizedList = <T extends { id: string | number }>(
  items: T[],
  options?: {
    sortBy?: (a: T, b: T) => number;
    filterBy?: (item: T) => boolean;
    keyExtractor?: (item: T, index: number) => string;
  }
) => {
  // Memoize sorted and filtered items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply filter
    if (options?.filterBy) {
      result = result.filter(options.filterBy);
    }

    // Apply sort
    if (options?.sortBy) {
      result.sort(options.sortBy);
    }

    return result;
  }, [items, options?.filterBy, options?.sortBy]);

  // Default key extractor
  const keyExtractor = useCallback(
    (item: T, index: number) => {
      return options?.keyExtractor?.(item, index) || `${item.id}-${index}`;
    },
    [options?.keyExtractor]
  );

  return { processedItems, keyExtractor };
};

/**
 * Hook for tracking visible items in list
 * Useful for loading images or analytics
 */
export const useVisibleItems = <T extends { id: string | number }>(
  items: T[]
) => {
  const [visibleItems, setVisibleItems] = React.useState<Set<string | number>>(
    new Set()
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleIds = new Set(
        viewableItems
          .filter((item) => item.isViewable)
          .map((item) => item.key)
      );
      setVisibleItems(visibleIds);
    },
    []
  );

  const viewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 250,
      viewAreaCoveragePercentThreshold: 5,
    }),
    []
  );

  return {
    visibleItems,
    onViewableItemsChanged,
    viewabilityConfig,
  };
};

/**
 * Hook for pagination
 * Load more items as user scrolls
 */
export const usePaginatedList = <T extends { id: string | number }>(
  pageSize: number = 20
) => {
  const [page, setPage] = React.useState(0);
  const [items, setItems] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const addItems = useCallback((newItems: T[]) => {
    setItems((prev) => [...prev, ...newItems]);
    setHasMore(newItems.length === pageSize);
  }, [pageSize]);

  const loadNextPage = useCallback(
    async (loadMoreFn: (page: number, pageSize: number) => Promise<T[]>) => {
      if (isLoading || !hasMore) return;

      try {
        setIsLoading(true);
        const newItems = await loadMoreFn(page, pageSize);
        addItems(newItems);
        setPage((prev) => prev + 1);
      } catch (error) {
        console.error('Error loading more items:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, isLoading, hasMore, addItems]
  );

  const reset = useCallback(() => {
    setPage(0);
    setItems([]);
    setHasMore(true);
  }, []);

  return {
    items,
    page,
    isLoading,
    hasMore,
    addItems,
    loadNextPage,
    reset,
  };
};

/**
 * Hook for search/filter with debouncing
 */
export const useListSearch = <T extends { id: string | number }>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) => {
  const [searchText, setSearchText] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<T[]>(items);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();

    const results = items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        return String(value).toLowerCase().includes(lowerQuery);
      })
    );

    setSearchResults(results);
  }, [items, searchFields]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (text === '') {
        setSearchResults(items);
      } else {
        timeoutRef.current = setTimeout(() => {
          performSearch(text);
        }, debounceMs);
      }
    },
    [items, performSearch, debounceMs]
  );

  const clearSearch = useCallback(() => {
    setSearchText('');
    setSearchResults(items);
  }, [items]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    searchText,
    searchResults,
    handleSearch,
    clearSearch,
    isSearching: searchText.length > 0,
  };
};

/**
 * Create an optimized FlatList props object
 */
export const createOptimizedFlatListProps = (
  config?: Partial<OptimizedListConfig>
): Partial<FlatListProps<any>> => {
  const finalConfig = { ...DEFAULT_FLAT_LIST_CONFIG, ...config };

  return {
    initialNumToRender: finalConfig.initialNumToRender,
    maxToRenderPerBatch: finalConfig.maxToRenderPerBatch,
    updateCellsBatchingPeriod: finalConfig.updateCellsBatchingPeriod,
    removeClippedSubviews: finalConfig.removeClippedSubviews,
    windowSize: finalConfig.windowSize,
    getItemLayout: undefined, // Will be computed if needed
    scrollIndicatorInsets: { right: 1 },
  };
};

/**
 * Memoized FlatList component
 * Use this instead of raw FlatList for better performance
 */
export const OptimizedFlatList = React.memo(
  React.forwardRef<FlatList<any>, FlatListProps<any>>((props, ref) => {
    const optimizedProps = createOptimizedFlatListProps();
    const finalProps = { ...props, ...optimizedProps };
    return React.createElement(FlatList, { ...finalProps, ref });
  })
);

OptimizedFlatList.displayName = 'OptimizedFlatList';

/**
 * Performance monitoring for lists
 */
export const useListPerformance = (componentName: string) => {
  const metricsRef = useRef({
    renders: 0,
    lastRenderTime: 0,
    scrollEvents: 0,
    slowRenders: 0,
  });

  const logRender = useCallback(() => {
    metricsRef.current.renders++;
  }, []);

  const logScroll = useCallback(() => {
    metricsRef.current.scrollEvents++;
  }, []);

  const getMetrics = useCallback(() => {
    return {
      component: componentName,
      ...metricsRef.current,
    };
  }, [componentName]);

  React.useEffect(() => {
    if (__DEV__ && metricsRef.current.renders % 10 === 0) {
      console.log(
        `📊 ${componentName} metrics:`,
        getMetrics()
      );
    }
  }, [componentName, getMetrics]);

  return { logRender, logScroll, getMetrics };
};

export default {
  useOptimizedList,
  useVisibleItems,
  usePaginatedList,
  useListSearch,
  createOptimizedFlatListProps,
  OptimizedFlatList,
  useListPerformance,
};
