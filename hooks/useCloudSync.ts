/**
 * React Hooks for Cloud Sync System
 * Professional cloud synchronization with React integration
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cloudSync, SyncProvider, SyncStatus, SyncResult } from '@/services/cloudSync';

// Hook for cloud sync status and operations
export function useCloudSync(provider: SyncProvider = 'local') {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    initializeSync();
    
    return () => {
      mountedRef.current = false;
    };
  }, [provider]);

  const initializeSync = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await cloudSync.switchProvider(provider);
      await cloudSync.initialize();
      
      if (mountedRef.current) {
        setStatus(cloudSync.getStatus());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize sync';
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [provider]);

  const sync = useCallback(async (): Promise<SyncResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await cloudSync.forceSync();
      
      if (mountedRef.current) {
        setStatus(cloudSync.getStatus());
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshStatus = useCallback(() => {
    if (mountedRef.current) {
      setStatus(cloudSync.getStatus());
    }
  }, []);

  return {
    status,
    loading,
    error,
    sync,
    refreshStatus,
    initialize: initializeSync,
  };
}

// Hook for sync provider management
export function useSyncProviders() {
  const [currentProvider, setCurrentProvider] = useState<SyncProvider>('local');
  const [availableProviders] = useState<SyncProvider[]>(['local', 'firebase']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchProvider = useCallback(async (provider: SyncProvider) => {
    try {
      setLoading(true);
      setError(null);
      
      await cloudSync.switchProvider(provider);
      setCurrentProvider(provider);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch provider';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentProvider,
    availableProviders,
    switchProvider,
    loading,
    error,
  };
}

// Hook for sync analytics
export function useSyncAnalytics() {
  const { status } = useCloudSync();

  const analytics = useMemo(() => {
    if (!status) {
      return {
        syncHealth: 'unknown' as 'excellent' | 'good' | 'poor' | 'unknown',
        lastSyncFormatted: 'Never',
        uptime: 0,
        successRate: 0,
        averageSyncTime: 0,
        dataTransfer: {
          uploaded: 0,
          downloaded: 0,
          total: 0,
        },
        conflicts: {
          total: 0,
          resolved: 0,
          pending: 0,
        },
      };
    }

    // Calculate sync health
    const now = Date.now();
    const timeSinceLastSync = now - status.lastSync;
    const syncHealth = 
      timeSinceLastSync < 5 * 60 * 1000 ? 'excellent' :
      timeSinceLastSync < 30 * 60 * 1000 ? 'good' :
      timeSinceLastSync < 2 * 60 * 60 * 1000 ? 'poor' : 'unknown';

    // Format last sync
    const lastSyncFormatted = status.lastSync > 0 
      ? new Date(status.lastSync).toLocaleString()
      : 'Never';

    // Calculate uptime (simplified)
    const uptime = status.lastSync > 0 ? timeSinceLastSync : 0;

    // Calculate success rate
    const successRate = status.lastSyncSuccess ? 100 : 0;

    // Calculate conflicts
    const conflicts = {
      total: status.conflicts.length,
      resolved: status.conflicts.filter(c => c.resolved).length,
      pending: status.conflicts.filter(c => !c.resolved).length,
    };

    return {
      syncHealth,
      lastSyncFormatted,
      uptime,
      successRate,
      averageSyncTime: 0, // Would track in production
      dataTransfer: {
        uploaded: 0, // Would track in production
        downloaded: 0, // Would track in production
        total: 0, // Would track in production
      },
      conflicts,
    };
  }, [status]);

  return analytics;
}

// Hook for sync settings
export function useSyncSettings() {
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(10 * 60 * 1000); // 10 minutes
  const [conflictResolution, setConflictResolution] = useState<'latest' | 'manual'>('latest');
  const [maxRetries, setMaxRetries] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSettings = useCallback(async (settings: {
    autoSync?: boolean;
    syncInterval?: number;
    conflictResolution?: 'latest' | 'manual';
    maxRetries?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // In production, would save to storage
      if (settings.autoSync !== undefined) setAutoSync(settings.autoSync);
      if (settings.syncInterval !== undefined) setSyncInterval(settings.syncInterval);
      if (settings.conflictResolution !== undefined) setConflictResolution(settings.conflictResolution);
      if (settings.maxRetries !== undefined) setMaxRetries(settings.maxRetries);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      setAutoSync(true);
      setSyncInterval(10 * 60 * 1000);
      setConflictResolution('latest');
      setMaxRetries(3);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    autoSync,
    syncInterval,
    conflictResolution,
    maxRetries,
    saveSettings,
    resetSettings,
    loading,
    error,
  };
}

// Hook for sync conflicts
export function useSyncConflicts() {
  const { status } = useCloudSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conflicts = status?.conflicts || [];

  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'remote') => {
    try {
      setLoading(true);
      setError(null);
      
      // In production, would actually resolve the conflict
      console.log(`Resolving conflict ${conflictId} with ${resolution} resolution`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflict';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAllConflicts = useCallback(async (resolution: 'local' | 'remote') => {
    try {
      setLoading(true);
      setError(null);
      
      // Resolve all conflicts
      for (const conflict of conflicts) {
        await resolveConflict(conflict.id, resolution);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflicts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [conflicts, resolveConflict]);

  const ignoreConflict = useCallback(async (conflictId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In production, would ignore the conflict
      console.log(`Ignoring conflict ${conflictId}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ignore conflict';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    conflicts,
    loading,
    error,
    resolveConflict,
    resolveAllConflicts,
    ignoreConflict,
    pendingCount: conflicts.filter(c => !c.resolved).length,
    resolvedCount: conflicts.filter(c => c.resolved).length,
  };
}

// Combined hook for complete sync management
export function useCloudSyncComplete(provider: SyncProvider = 'local') {
  const sync = useCloudSync(provider);
  const providers = useSyncProviders();
  const analytics = useSyncAnalytics();
  const settings = useSyncSettings();
  const conflicts = useSyncConflicts();

  return {
    // Sync operations
    ...sync,
    
    // Provider management
    ...providers,
    
    // Analytics
    analytics,
    
    // Settings
    ...settings,
    
    // Conflicts
    ...conflicts,
    
    // Combined state
    isHealthy: analytics.syncHealth !== 'poor' && analytics.syncHealth !== 'unknown',
    needsAttention: analytics.conflicts.pending > 0 || !sync.status?.lastSyncSuccess,
    canSync: sync.status?.isOnline && !sync.loading,
  };
}

export default useCloudSyncComplete;
