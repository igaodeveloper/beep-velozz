/**
 * React Hooks for Advanced Storage System
 * Professional storage management with React integration
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { storageManager, UserPreferences, StorageStats, BackupData } from '@/utils/advancedStorage';
import { Session } from '@/types/session';

// Hook for sessions management
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadSessions();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSessions = await storageManager.loadSessions();
      if (mountedRef.current) {
        setSessions(loadedSessions);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const addSession = useCallback(async (session: Session) => {
    try {
      setError(null);
      await storageManager.addSession(session);
      await loadSessions(); // Refresh sessions list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add session';
      setError(errorMessage);
      throw err;
    }
  }, [loadSessions]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    try {
      setError(null);
      await storageManager.updateSession(sessionId, updates);
      await loadSessions(); // Refresh sessions list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      throw err;
    }
  }, [loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      await storageManager.deleteSession(sessionId);
      await loadSessions(); // Refresh sessions list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      throw err;
    }
  }, [loadSessions]);

  const clearSessions = useCallback(async () => {
    try {
      setError(null);
      await storageManager.clearSessions();
      setSessions([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear sessions';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    clearSessions,
    refresh,
  };
}

// Hook for user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadPreferences();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedPreferences = await storageManager.loadPreferences();
      if (mountedRef.current) {
        setPreferences(loadedPreferences);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const savePreferences = useCallback(async (newPreferences: UserPreferences) => {
    try {
      setError(null);
      await storageManager.savePreferences(newPreferences);
      if (mountedRef.current) {
        setPreferences(newPreferences);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!preferences) return;
    
    const updatedPreferences = { ...preferences, [key]: value };
    await savePreferences(updatedPreferences);
  }, [preferences, savePreferences]);

  const resetPreferences = useCallback(async () => {
    const defaultPreferences = await storageManager.loadPreferences(); // Gets defaults
    await savePreferences(defaultPreferences);
  }, [savePreferences]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    updatePreference,
    resetPreferences,
    refresh: loadPreferences,
  };
}

// Hook for storage statistics
export function useStorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storageStats = await storageManager.getStorageStats();
      setStats(storageStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load storage stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}

// Hook for backup functionality
export function useBackup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<number | null>(null);

  const createBackup = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const backupData = await storageManager.createBackup();
      setLastBackup(Date.now());
      return backupData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBackup = useCallback(async (backupData: string) => {
    try {
      setLoading(true);
      setError(null);
      await storageManager.restoreBackup(backupData);
      setLastBackup(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore backup';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportBackup = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      return await createBackup();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export backup';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createBackup]);

  const importBackup = useCallback(async (backupData: string) => {
    try {
      setLoading(true);
      setError(null);
      await restoreBackup(backupData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import backup';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [restoreBackup]);

  return {
    loading,
    error,
    lastBackup,
    createBackup,
    restoreBackup,
    exportBackup,
    importBackup,
  };
}

// Hook for storage maintenance
export function useStorageMaintenance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageManager.cleanup();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup storage';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageManager.clearAll();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear storage';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    cleanup,
    clearAll,
  };
}

// Hook for session analytics
export function useSessionAnalytics() {
  const { sessions } = useSessions();

  const analytics = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalPackages: 0,
        averagePackagesPerSession: 0,
        sessionsWithDivergence: 0,
        divergenceRate: 0,
        mostActiveOperator: null,
        recentSessions: [],
        sessionsByMonth: {},
        packagesByType: {
          shopee: 0,
          mercado_livre: 0,
          avulso: 0,
        },
      };
    }

    const totalPackages = sessions.reduce((sum, session) => sum + session.packages.length, 0);
    const sessionsWithDivergence = sessions.filter(session => session.hasDivergence).length;
    const averagePackagesPerSession = totalPackages / sessions.length;
    const divergenceRate = (sessionsWithDivergence / sessions.length) * 100;

    // Find most active operator
    const operatorCounts = sessions.reduce((acc, session) => {
      acc[session.operatorName] = (acc[session.operatorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveOperator = Object.entries(operatorCounts).reduce(
      (max, [operator, count]) => (count > max.count ? { operator, count } : max),
      { operator: '', count: 0 }
    ).operator || null;

    // Group sessions by month
    const sessionsByMonth = sessions.reduce((acc, session) => {
      const date = new Date(session.startedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count packages by type
    const packagesByType = sessions.reduce(
      (acc, session) => {
        session.packages.forEach(pkg => {
          const pkgType = (pkg as any).type || 'unknown';
          acc[pkgType] = (acc[pkgType] || 0) + 1;
        });
        return acc;
      },
      { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 } as Record<string, number>
    );

    // Recent sessions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions
      .filter(session => new Date(session.startedAt) >= sevenDaysAgo)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      totalPackages,
      averagePackagesPerSession: Math.round(averagePackagesPerSession * 100) / 100,
      sessionsWithDivergence,
      divergenceRate: Math.round(divergenceRate * 100) / 100,
      mostActiveOperator,
      recentSessions,
      sessionsByMonth,
      packagesByType,
    };
  }, [sessions]);

  return analytics;
}

// Hook for session search and filtering
export function useSessionSearch() {
  const { sessions } = useSessions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    operator: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
    hasDivergence: 'all' as 'all' | 'yes' | 'no',
  });

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.operatorName.toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query) ||
        session.packages.some(pkg => pkg.code.toLowerCase().includes(query))
      );
    }

    // Apply operator filter
    if (filters.operator) {
      filtered = filtered.filter(session =>
        session.operatorName.toLowerCase().includes(filters.operator.toLowerCase())
      );
    }

    // Apply date range filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(session => new Date(session.startedAt) >= today);
        break;
      case 'week':
        filtered = filtered.filter(session => new Date(session.startedAt) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(session => new Date(session.startedAt) >= monthAgo);
        break;
    }

    // Apply divergence filter
    if (filters.hasDivergence !== 'all') {
      filtered = filtered.filter(session =>
        filters.hasDivergence === 'yes' ? session.hasDivergence : !session.hasDivergence
      );
    }

    return filtered;
  }, [sessions, searchQuery, filters]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredSessions,
    resultCount: filteredSessions.length,
  };
}

// Combined hook for complete storage management
export function useAdvancedStorage() {
  const sessions = useSessions();
  const preferences = useUserPreferences();
  const stats = useStorageStats();
  const backup = useBackup();
  const maintenance = useStorageMaintenance();
  const analytics = useSessionAnalytics();
  const search = useSessionSearch();

  return {
    // Sessions
    ...sessions,
    
    // Preferences
    ...preferences,
    
    // Statistics
    ...stats,
    
    // Backup
    ...backup,
    
    // Maintenance
    ...maintenance,
    
    // Analytics
    analytics,
    
    // Search
    ...search,
  };
}

export default useAdvancedStorage;
