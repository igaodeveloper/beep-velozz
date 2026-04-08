// src/utils/memoization.ts
/**
 * Performance optimization utilities
 * Provides memoization helpers and best practices
 */

import React, { useMemo, useCallback, useRef } from 'react';

/**
 * Custom hook for shallow comparison memoization
 * Use when useState value doesn't need deep comparisons
 */
export const useShallowMemo = <T extends Record<string, any>>(
  value: T,
  deps: React.DependencyList
): T => {
  const ref = useRef<T>(value);
  const prevDepsRef = useRef<React.DependencyList>(deps);

  // Compare dependencies
  const depsChanged =
    !prevDepsRef.current || prevDepsRef.current.length !== deps.length ||
    prevDepsRef.current.some((dep, i) => dep !== deps[i]);

  if (depsChanged) {
    ref.current = value;
    prevDepsRef.current = deps;
  }

  return ref.current;
};

/**
 * Stable callback wrapper that doesn't recreate on each render
 * More efficient than useCallback for simple handlers
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);

  // Update the ref if callback changes
  callbackRef.current = callback;

  // Return a stable wrapper
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
};

/**
 * Debounced callback
 * Useful for expensive operations like API calls
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delayMs: number = 300
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delayMs);
    },
    [callback, delayMs]
  ) as T;
};

/**
 * Throttled callback
 * Useful for scroll/resize handlers
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  intervalMs: number = 200
): T => {
  const lastRunRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= intervalMs) {
        lastRunRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callback(...args);
        }, intervalMs - timeSinceLastRun);
      }
    },
    [callback, intervalMs]
  ) as T;
};

/**
 * Memoize expensive computation results
 * Better than useMemo for consistency
 */
export const useMemoized = <T>(
  fn: () => T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  return useMemo(() => {
    const start = Date.now();
    const result = fn();
    const duration = Date.now() - start;

    // Log expensive computations in dev
    if (__DEV__ && duration > 16 && debugName) {
      console.warn(`⚠️ Slow computation: ${debugName} took ${duration}ms`);
    }

    return result;
  }, deps);
};

/**
 * Create a memo component with custom comparison
 */
export const createMemoComponent = <P extends object>(
  Component: React.ComponentType<P>,
  compare?: (prevProps: P, nextProps: P) => boolean,
  displayName?: string
): React.NamedExoticComponent<P> => {
  const Memoized = React.memo(Component, compare);

  if (displayName) {
    Memoized.displayName = `Memoized(${displayName})`;
  }

  return Memoized;
};

/**
 * Previous value hook
 * Track previous prop/state value
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Performance measurement hook
 * Measure render time and component lifecycle
 */
export const usePerformanceMetrics = (componentName: string) => {
  const startTimeRef = useRef(Date.now());
  const renderCountRef = useRef(0);

  React.useEffect(() => {
    renderCountRef.current++;

    if (__DEV__ && renderCountRef.current === 1) {
      const renderTime = Date.now() - startTimeRef.current;
      console.log(`⏱️  ${componentName} mounted in ${renderTime}ms`);
    }

    return () => {
      if (__DEV__ && renderCountRef.current > 0) {
        console.log(`♻️  ${componentName} unmounted after ${renderCountRef.current} renders`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    getMetrics: () => ({
      name: componentName,
      renderCount: renderCountRef.current,
    }),
  };
};

/**
 * List rendering optimization
 * Prevent full list re-render when items change
 */
export const createListItemMemo = <T extends { id: string | number }>(
  Component: React.ComponentType<{ item: T; index?: number }>,
  displayName?: string
) => {
  const MemoizedItem = React.memo(
    Component,
    (prevProps, nextProps) => {
      // Only re-render if item ID or completely new item
      return prevProps.item.id === nextProps.item.id;
    }
  );

  if (displayName) {
    MemoizedItem.displayName = `MemoizedItem(${displayName})`;
  }

  return MemoizedItem;
};

/**
 * Reducer optimization hook
 * Prevents reducer recreation
 */
export const useReducerOptimized = <S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  init?: (initial: S) => S
) => {
  const [state, dispatch] = React.useReducer(reducer, initialState, init);

  // Memoize dispatch to ensure it's always the same reference
  const memoizedDispatch = useCallback(
    (action: A) => {
      dispatch(action);
    },
    []
  );

  return [state, memoizedDispatch] as const;
};

export default {
  useShallowMemo,
  useStableCallback,
  useDebouncedCallback,
  useThrottledCallback,
  useMemoized,
  createMemoComponent,
  usePrevious,
  usePerformanceMetrics,
  createListItemMemo,
  useReducerOptimized,
};
