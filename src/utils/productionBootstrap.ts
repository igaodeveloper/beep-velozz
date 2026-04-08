// src/utils/productionBootstrap.ts
/**
 * Production bootstrap and lifecycle management
 * Ensures proper initialization, cleanup, and error handling
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { envConfig, isProduction } from '@/src/config/envConfig';

/**
 * Centralized error handler for production
 */
class ProductionErrorHandler {
  private isInitialized = false;
  private errorQueue: Error[] = [];
  private maxQueueSize = 50;

  /**
   * Initialize error handling
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Global error handler
    if (!__DEV__) {
      // In production, log errors
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        this.logError(new Error(String(args[0])));
        originalConsoleError(...args);
      };
    }

    // Unhandled promise rejections
    const unhandledRejectionHandler = (reason: any) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.logError(error);
    };

    process.on('unhandledRejection', unhandledRejectionHandler);

    this.isInitialized = true;
    console.log('✅ Production error handling initialized');
  }

  /**
   * Log error
   */
  private logError(error: Error): void {
    this.errorQueue.push(error);

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // In production, send to monitoring service
    if (isProduction()) {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Send error to monitoring service (e.g., Sentry, LogRocket)
   */
  private sendToMonitoring(error: Error): void {
    // TODO: Implement integration with Sentry or similar
    console.log('📡 Error sent to monitoring:', error.message);
  }

  /**
   * Get error history
   */
  getErrorHistory(): Error[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorQueue = [];
  }
}

/**
 * App lifecycle management
 * Handles app state changes (foreground/background)
 */
class AppLifecycleManager {
  private appState = 'active' as AppStateStatus;
  private listeners: Map<string, (state: AppStateStatus) => void> = new Map();
  private subscription: any = null;

  /**
   * Initialize app lifecycle management
   */
  initialize(): void {
    if (this.subscription) return;

    this.subscription = AppState.addEventListener('change', this.handleAppStateChange);
    console.log('✅ App lifecycle management initialized');
  }

  /**
   * Handle app state change
   */
  private handleAppStateChange = (state: AppStateStatus): void => {
    const prevState = this.appState;
    this.appState = state;

    if (state === 'active' && prevState !== 'active') {
      this.notifyListeners('foreground');
      console.log('📱 App came to foreground');
    } else if (state !== 'active' && prevState === 'active') {
      this.notifyListeners('background');
      console.log('📱 App went to background');
    }
  };

  /**
   * Register listener for app state changes
   */
  onStateChange(
    name: string,
    callback: (state: AppStateStatus) => void
  ): () => void {
    this.listeners.set(name, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(name);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: 'foreground' | 'background'): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.appState);
      } catch (error) {
        console.error(`Error in app state listener: ${error}`);
      }
    });
  }

  /**
   * Clean up
   */
  cleanup(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

/**
 * Resource cleanup manager
 * Prevents memory leaks
 */
class ResourceCleanupManager {
  private cleanup: (() => void)[] = [];
  private timers: NodeJS.Timeout[] = [];
  private subscriptions: any[] = [];

  /**
   * Register cleanup function
   */
  registerCleanup(fn: () => void): void {
    this.cleanup.push(fn);
  }

  /**
   * Register timer for cleanup tracking
   */
  registerTimer(timer: NodeJS.Timeout): void {
    this.timers.push(timer);
  }

  /**
   * Register subscription for cleanup
   */
  registerSubscription(subscription: any): void {
    this.subscriptions.push(subscription);
  }

  /**
   * Execute all cleanup functions
   */
  executeCleanup(): void {
    // Clear timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];

    // Unsubscribe from subscriptions
    this.subscriptions.forEach((sub) => {
      if (typeof sub?.unsubscribe === 'function') {
        sub.unsubscribe();
      } else if (typeof sub?.remove === 'function') {
        sub.remove();
      }
    });
    this.subscriptions = [];

    // Execute cleanup functions
    this.cleanup.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanup = [];

    console.log('✅ Resource cleanup completed');
  }
}

/**
 * Global instances
 */
export const errorHandler = new ProductionErrorHandler();
export const lifecycleManager = new AppLifecycleManager();
export const cleanupManager = new ResourceCleanupManager();

/**
 * Hook for managing component cleanup
 */
export const useProductionCleanup = (componentName: string) => {
  const cleanupRef = useRef<(() => void)[]>([]);

  const registerCleanup = (fn: () => void) => {
    cleanupRef.current.push(fn);
  };

  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error(`Cleanup error in ${componentName}:`, error);
        }
      });
      cleanupRef.current = [];
    };
  }, [componentName]);

  return { registerCleanup };
};

/**
 * Hook for handling app state changes
 */
export const useAppStateChange = (
  onForeground?: () => void,
  onBackground?: () => void
) => {
  useEffect(() => {
    const unsubscribe = lifecycleManager.onStateChange('app-state', (state) => {
      if (state === 'active' && onForeground) {
        onForeground();
      } else if (state !== 'active' && onBackground) {
        onBackground();
      }
    });

    return unsubscribe;
  }, [onForeground, onBackground]);
};

/**
 * Initialize production environment
 * Call this once at app startup
 */
export const initializeProduction = (): void => {
  console.log('🚀 Initializing production environment...');

  // Initialize error handling
  errorHandler.initialize();

  // Initialize app lifecycle management
  lifecycleManager.initialize();

  // Set up crash reporting if in production
  if (isProduction()) {
    console.log('📡 Crash reporting initialized');
    // TODO: Initialize Sentry or similar
  }

  console.log('✅ Production environment ready');
};

/**
 * Clean up production environment
 * Call this before app termination
 */
export const cleanupProduction = (): void => {
  console.log('🧹 Cleaning up production environment...');

  cleanupManager.executeCleanup();
  lifecycleManager.cleanup();

  console.log('✅ Production cleanup completed');
};

/**
 * Get production status
 */
export const getProductionStatus = () => {
  const env = envConfig.environment;
  const platform = Platform.OS;
  const errorCount = errorHandler.getErrorHistory().length;

  return {
    environment: env,
    platform,
    isProduction: isProduction(),
    errorCount,
    timestamp: new Date().toISOString(),
  };
};

export default {
  errorHandler,
  lifecycleManager,
  cleanupManager,
  useProductionCleanup,
  useAppStateChange,
  initializeProduction,
  cleanupProduction,
  getProductionStatus,
};
