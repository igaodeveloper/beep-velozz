/**
 * Cloud Sync Service for Beep Velozz
 * Professional cloud synchronization with multiple providers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { storageManager, UserPreferences, BackupData } from '@/utils/advancedStorage';

// Sync configuration
const SYNC_CONFIG = {
  AUTO_SYNC_ENABLED: true,
  SYNC_INTERVAL: 10 * 60 * 1000, // 10 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5 * 1000, // 5 seconds
  MAX_BATCH_SIZE: 100, // Max items per sync batch
  CONFLICT_RESOLUTION: 'latest' as 'latest' | 'manual',
} as const;

// Sync providers
type SyncProvider = 'firebase' | 'supabase' | 'aws' | 'local';

interface SyncStatus {
  lastSync: number;
  lastSyncSuccess: boolean;
  pendingChanges: number;
  conflicts: SyncConflict[];
  provider: SyncProvider;
  isOnline: boolean;
  syncInProgress: boolean;
}

interface SyncConflict {
  id: string;
  type: 'session' | 'preference';
  localData: any;
  remoteData: any;
  timestamp: number;
  resolved: boolean;
}

interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: SyncConflict[];
  error?: string;
}

interface CloudSession {
  id: string;
  data: any;
  timestamp: number;
  deviceId: string;
  version: number;
  deleted?: boolean;
}

interface CloudPreferences {
  data: UserPreferences;
  timestamp: number;
  deviceId: string;
  version: number;
}

// Abstract sync provider
abstract class BaseSyncProvider {
  protected deviceId: string;
  protected providerName: SyncProvider;

  constructor(deviceId: string, providerName: SyncProvider) {
    this.deviceId = deviceId;
    this.providerName = providerName;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract uploadSessions(sessions: CloudSession[]): Promise<boolean>;
  abstract downloadSessions(): Promise<CloudSession[]>;
  abstract uploadPreferences(preferences: CloudPreferences): Promise<boolean>;
  abstract downloadPreferences(): Promise<CloudPreferences | null>;
  abstract deleteSession(sessionId: string): Promise<boolean>;
  abstract isOnline(): Promise<boolean>;

  protected generateCloudSession(session: any, version: number = 1): CloudSession {
    return {
      id: session.id,
      data: session,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      version,
    };
  }

  protected generateCloudPreferences(preferences: UserPreferences, version: number = 1): CloudPreferences {
    return {
      data: preferences,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      version,
    };
  }
}

// Firebase Sync Provider (Mock Implementation)
class FirebaseSyncProvider extends BaseSyncProvider {
  private isConnected = false;

  constructor(deviceId: string) {
    super(deviceId, 'firebase');
  }

  async connect(): Promise<boolean> {
    try {
      // Mock Firebase connection
      // In production, would initialize Firebase SDK
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Firebase connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async uploadSessions(sessions: CloudSession[]): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      // Mock upload to Firebase
      console.log(`Uploading ${sessions.length} sessions to Firebase`);
      await this.delay(1000); // Simulate network delay
      return true;
    } catch (error) {
      console.error('Firebase upload failed:', error);
      return false;
    }
  }

  async downloadSessions(): Promise<CloudSession[]> {
    if (!this.isConnected) return [];
    
    try {
      // Mock download from Firebase
      console.log('Downloading sessions from Firebase');
      await this.delay(800); // Simulate network delay
      return []; // Return empty for now
    } catch (error) {
      console.error('Firebase download failed:', error);
      return [];
    }
  }

  async uploadPreferences(preferences: CloudPreferences): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      console.log('Uploading preferences to Firebase');
      await this.delay(500);
      return true;
    } catch (error) {
      console.error('Firebase preferences upload failed:', error);
      return false;
    }
  }

  async downloadPreferences(): Promise<CloudPreferences | null> {
    if (!this.isConnected) return null;
    
    try {
      console.log('Downloading preferences from Firebase');
      await this.delay(300);
      return null; // Return null for now
    } catch (error) {
      console.error('Firebase preferences download failed:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      console.log(`Deleting session ${sessionId} from Firebase`);
      await this.delay(200);
      return true;
    } catch (error) {
      console.error('Firebase session deletion failed:', error);
      return false;
    }
  }

  async isOnline(): Promise<boolean> {
    return this.isConnected;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Local Sync Provider (for offline mode)
class LocalSyncProvider extends BaseSyncProvider {
  private readonly LOCAL_SYNC_KEY = 'beepvelozz_local_sync';

  constructor(deviceId: string) {
    super(deviceId, 'local');
  }

  async connect(): Promise<boolean> {
    return true; // Local always available
  }

  async disconnect(): Promise<void> {
    // No cleanup needed for local
  }

  async uploadSessions(sessions: CloudSession[]): Promise<boolean> {
    try {
      const existing = await this.getLocalData();
      const updated = {
        ...existing,
        sessions: [...(existing.sessions || []), ...sessions],
      };
      await AsyncStorage.setItem(this.LOCAL_SYNC_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Local upload failed:', error);
      return false;
    }
  }

  async downloadSessions(): Promise<CloudSession[]> {
    try {
      const data = await this.getLocalData();
      return data.sessions || [];
    } catch (error) {
      console.error('Local download failed:', error);
      return [];
    }
  }

  async uploadPreferences(preferences: CloudPreferences): Promise<boolean> {
    try {
      const existing = await this.getLocalData();
      const updated = {
        ...existing,
        preferences,
      };
      await AsyncStorage.setItem(this.LOCAL_SYNC_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Local preferences upload failed:', error);
      return false;
    }
  }

  async downloadPreferences(): Promise<CloudPreferences | null> {
    try {
      const data = await this.getLocalData();
      return data.preferences || null;
    } catch (error) {
      console.error('Local preferences download failed:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const existing = await this.getLocalData();
      const updated = {
        ...existing,
        sessions: (existing.sessions || []).filter((s: any) => s.id !== sessionId),
      };
      await AsyncStorage.setItem(this.LOCAL_SYNC_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Local session deletion failed:', error);
      return false;
    }
  }

  async isOnline(): Promise<boolean> {
    return true; // Local always available
  }

  private async getLocalData(): Promise<any> {
    const raw = await AsyncStorage.getItem(this.LOCAL_SYNC_KEY);
    return raw ? JSON.parse(raw) : {};
  }
}

// Main Cloud Sync Manager
class CloudSyncManager {
  private provider: BaseSyncProvider;
  private status: SyncStatus;
  private syncInterval: any = null;
  private deviceId: string;
  private conflictResolver: ConflictResolver;

  constructor(provider: SyncProvider = 'local') {
    this.deviceId = this.generateDeviceId();
    this.provider = this.createProvider(provider);
    this.conflictResolver = new ConflictResolver();
    this.status = {
      lastSync: 0,
      lastSyncSuccess: false,
      pendingChanges: 0,
      conflicts: [],
      provider,
      isOnline: false,
      syncInProgress: false,
    };
  }

  private generateDeviceId(): string {
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createProvider(provider: SyncProvider): BaseSyncProvider {
    switch (provider) {
      case 'firebase':
        return new FirebaseSyncProvider(this.deviceId);
      case 'local':
      default:
        return new LocalSyncProvider(this.deviceId);
    }
  }

  async initialize(): Promise<void> {
    try {
      // Load sync status
      await this.loadSyncStatus();
      
      // Connect to provider
      const connected = await this.provider.connect();
      this.status.isOnline = connected;
      
      // Start auto sync if enabled
      if (SYNC_CONFIG.AUTO_SYNC_ENABLED) {
        this.startAutoSync();
      }
      
      console.log(`Cloud sync initialized with provider: ${this.provider['providerName']}`);
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error);
    }
  }

  async syncAll(): Promise<SyncResult> {
    if (this.status.syncInProgress) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        error: 'Sync already in progress',
      };
    }

    this.status.syncInProgress = true;

    try {
      // Upload local changes
      const uploadResult = await this.uploadLocalChanges();
      
      // Download remote changes
      const downloadResult = await this.downloadRemoteChanges();
      
      // Resolve conflicts
      const resolvedConflicts = await this.resolveConflicts();
      
      // Update status
      this.status.lastSync = Date.now();
      this.status.lastSyncSuccess = true;
      this.status.pendingChanges = 0;
      await this.saveSyncStatus();

      return {
        success: true,
        uploaded: uploadResult,
        downloaded: downloadResult,
        conflicts: resolvedConflicts,
      };
    } catch (error) {
      this.status.lastSyncSuccess = false;
      await this.saveSyncStatus();
      
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    } finally {
      this.status.syncInProgress = false;
    }
  }

  private async uploadLocalChanges(): Promise<number> {
    try {
      // Upload sessions
      const sessions = await storageManager.loadSessions();
      const cloudSessions = sessions.map(session => 
        (this.provider as any).generateCloudSession(session)
      );
      
      // Batch upload
      const batches = this.createBatches(cloudSessions, SYNC_CONFIG.MAX_BATCH_SIZE);
      let uploaded = 0;
      
      for (const batch of batches) {
        const success = await this.provider.uploadSessions(batch);
        if (success) {
          uploaded += batch.length;
        }
      }
      
      // Upload preferences
      const preferences = await storageManager.loadPreferences();
      const cloudPreferences = (this.provider as any).generateCloudPreferences(preferences);
      await this.provider.uploadPreferences(cloudPreferences);
      
      return uploaded;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  private async downloadRemoteChanges(): Promise<number> {
    try {
      // Download sessions
      const remoteSessions = await this.provider.downloadSessions();
      let downloaded = 0;
      
      if (remoteSessions.length > 0) {
        // Check for conflicts and merge
        const localSessions = await storageManager.loadSessions();
        const mergedSessions = await this.mergeSessions(localSessions, remoteSessions);
        
        if (mergedSessions.length !== localSessions.length) {
          await storageManager.saveSessions(mergedSessions);
          downloaded = mergedSessions.length - localSessions.length;
        }
      }
      
      // Download preferences
      const remotePreferences = await this.provider.downloadPreferences();
      if (remotePreferences) {
        const localPreferences = await storageManager.loadPreferences();
        if (remotePreferences.timestamp > this.status.lastSync) {
          await storageManager.savePreferences(remotePreferences.data);
          downloaded++;
        }
      }
      
      return downloaded;
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  private async mergeSessions(
    localSessions: any[],
    remoteSessions: CloudSession[]
  ): Promise<any[]> {
    const merged = [...localSessions];
    const conflicts: SyncConflict[] = [];

    for (const remoteSession of remoteSessions) {
      const localIndex = merged.findIndex(s => s.id === remoteSession.id);
      
      if (localIndex === -1) {
        // New session from remote
        merged.push(remoteSession.data);
      } else {
        // Check for conflict
        const localSession = merged[localIndex];
        const localTimestamp = new Date(localSession.startedAt).getTime();
        const remoteTimestamp = remoteSession.timestamp;

        if (remoteTimestamp > localTimestamp) {
          // Remote is newer, replace local
          merged[localIndex] = remoteSession.data;
        } else if (remoteTimestamp !== localTimestamp) {
          // Conflict detected
          conflicts.push({
            id: remoteSession.id,
            type: 'session',
            localData: localSession,
            remoteData: remoteSession.data,
            timestamp: Date.now(),
            resolved: false,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      this.status.conflicts.push(...conflicts);
      await this.resolveConflicts();
    }

    return merged;
  }

  private async resolveConflicts(): Promise<SyncConflict[]> {
    const resolved = await this.conflictResolver.resolveConflicts(this.status.conflicts);
    this.status.conflicts = this.status.conflicts.filter(c => !c.resolved);
    return resolved;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(async () => {
      if (this.status.isOnline && !this.status.syncInProgress) {
        await this.syncAll();
      }
    }, SYNC_CONFIG.SYNC_INTERVAL);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem('beepvelozz_sync_status');
      if (raw) {
        this.status = { ...this.status, ...JSON.parse(raw) };
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('beepvelozz_sync_status', JSON.stringify(this.status));
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }

  // Public API
  async switchProvider(provider: SyncProvider): Promise<void> {
    this.stopAutoSync();
    await this.provider.disconnect();
    
    this.provider = this.createProvider(provider);
    this.status.provider = provider;
    
    await this.initialize();
  }

  async forceSync(): Promise<SyncResult> {
    return await this.syncAll();
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  async disconnect(): Promise<void> {
    this.stopAutoSync();
    await this.provider.disconnect();
  }
}

// Conflict Resolution Service
class ConflictResolver {
  async resolveConflicts(conflicts: SyncConflict[]): Promise<SyncConflict[]> {
    const resolved: SyncConflict[] = [];

    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveConflict(conflict);
        if (resolution) {
          resolved.push({ ...conflict, resolved: true });
        }
      } catch (error) {
        console.error('Failed to resolve conflict:', conflict.id, error);
      }
    }

    return resolved;
  }

  private async resolveConflict(conflict: SyncConflict): Promise<boolean> {
    switch (SYNC_CONFIG.CONFLICT_RESOLUTION) {
      case 'latest':
        return this.resolveByLatest(conflict);
      case 'manual':
        return this.resolveManually(conflict);
      default:
        return false;
    }
  }

  private async resolveByLatest(conflict: SyncConflict): Promise<boolean> {
    // Always prefer the latest version
    const remoteTimestamp = new Date(conflict.remoteData.startedAt).getTime();
    const localTimestamp = new Date(conflict.localData.startedAt).getTime();

    if (remoteTimestamp > localTimestamp) {
      // Use remote version
      await storageManager.updateSession(conflict.id, conflict.remoteData);
    }

    return true;
  }

  private async resolveManually(conflict: SyncConflict): Promise<boolean> {
    // In a real app, this would show UI for user to choose
    // For now, default to latest
    return this.resolveByLatest(conflict);
  }
}

// Export singleton instance
export const cloudSync = new CloudSyncManager();

// Export types and utilities
export { SyncProvider, SyncStatus, SyncResult, CloudSession };
export default cloudSync;
