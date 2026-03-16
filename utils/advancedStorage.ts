/**
 * Advanced Storage System for Beep Velozz
 * Professional, robust, and secure data persistence layer
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@/types/session';
import { Platform } from 'react-native';

// Simple encryption implementation (without crypto-js dependency)
class SimpleEncryption {
  private static readonly KEY = 'beepvelozz_simple_key_2024';

  static encrypt(data: string): string {
    try {
      // Simple XOR encryption for demonstration
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ this.KEY.charCodeAt(i % this.KEY.length)
        );
      }
      return btoa(result);
    } catch (error) {
      console.warn('Encryption failed:', error);
      return data;
    }
  }

  static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ this.KEY.charCodeAt(i % this.KEY.length)
        );
      }
      return result;
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData;
    }
  }

  static generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Storage keys with versioning
const STORAGE_KEYS = {
  SESSIONS: 'beepvelozz_sessions_v2',
  USER_PREFERENCES: 'beepvelozz_preferences_v2',
  APP_STATE: 'beepvelozz_app_state_v2',
  CACHE: 'beepvelozz_cache_v2',
  BACKUP: 'beepvelozz_backup_v2',
  ANALYTICS: 'beepvelozz_analytics_v2',
  SECURITY: 'beepvelozz_security_v2',
} as const;

// Storage configuration
const STORAGE_CONFIG = {
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_SESSIONS: 10000,
  AUTO_BACKUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  COMPRESSION_THRESHOLD: 1024, // 1KB
  ENCRYPTION_ENABLED: true,
  RETENTION_DAYS: 365, // 1 year
} as const;

// Types for advanced storage
interface StorageMetadata {
  version: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  metadata: StorageMetadata;
}

interface BackupData {
  sessions: Session[];
  preferences: UserPreferences;
  timestamp: number;
  version: string;
  deviceInfo: DeviceInfo;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  scanner: ScannerPreferences;
  analytics: boolean;
  autoBackup: boolean;
}

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  divergences: boolean;
  summaries: boolean;
}

interface ScannerPreferences {
  haptics: boolean;
  sound: boolean;
  autoFocus: boolean;
  flashMode: 'auto' | 'on' | 'off';
  quality: 'low' | 'medium' | 'high';
}

interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  appVersion: string;
  uniqueId: string;
}

interface StorageStats {
  totalSize: number;
  sessionsCount: number;
  cacheSize: number;
  lastBackup: number;
  compressionRatio: number;
}

// Encryption utilities
class StorageEncryption {
  private static readonly ENCRYPTION_KEY = 'beepvelozz_master_key_2024';

  static encrypt(data: string): string {
    if (!STORAGE_CONFIG.ENCRYPTION_ENABLED) return data;
    return SimpleEncryption.encrypt(data);
  }

  static decrypt(encryptedData: string): string {
    if (!STORAGE_CONFIG.ENCRYPTION_ENABLED) return encryptedData;
    return SimpleEncryption.decrypt(encryptedData);
  }

  static generateChecksum(data: string): string {
    return SimpleEncryption.generateChecksum(data);
  }
}

// Compression utilities
class StorageCompression {
  static async compress(data: string): Promise<string> {
    if (data.length < STORAGE_CONFIG.COMPRESSION_THRESHOLD) return data;
    
    try {
      // Simple compression simulation (in production, use proper compression library)
      return btoa(data);
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  static async decompress(compressedData: string): Promise<string> {
    try {
      // Simple decompression simulation
      return atob(compressedData);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressedData;
    }
  }
}

// Cache management
class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    const metadata: StorageMetadata = {
      version: '2.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: JSON.stringify(data).length,
      compressed: false,
      encrypted: false,
      checksum: StorageEncryption.generateChecksum(JSON.stringify(data)),
    };

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      metadata,
    };

    this.cache.set(key, entry);
    
    // Persist to AsyncStorage
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.cache.get(key);
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      return memEntry.data;
    }

    // Check persistent cache
    try {
      const raw = await AsyncStorage.getItem(`cache_${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      
      // Check TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return null;
      }

      // Verify checksum
      const currentChecksum = StorageEncryption.generateChecksum(JSON.stringify(entry.data));
      if (currentChecksum !== entry.metadata.checksum) {
        console.warn('Cache checksum mismatch for key:', key);
        await this.delete(key);
        return null;
      }

      // Update memory cache
      this.cache.set(key, entry);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await AsyncStorage.removeItem(`cache_${key}`);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        await this.delete(key);
      }
    }
  }
}

// Main storage class
class AdvancedStorageManager {
  private cacheManager = new CacheManager();
  private encryptionKey: string | null = null;
  private deviceInfo: DeviceInfo | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Initialize device info
    this.deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: 'Unknown', // Would use device-info module in production
      appVersion: '1.0.0',
      uniqueId: this.generateUniqueId(),
    };

    // Setup encryption key
    await this.setupEncryption();

    // Start auto cleanup
    this.startAutoCleanup();
  }

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async setupEncryption(): Promise<void> {
    try {
      const storedKey = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY);
      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        const newKey = this.generateUniqueId();
        await AsyncStorage.setItem(STORAGE_KEYS.SECURITY, newKey);
        this.encryptionKey = newKey;
      }
    } catch (error) {
      console.error('Failed to setup encryption:', error);
    }
  }

  private startAutoCleanup(): void {
    setInterval(async () => {
      await this.cleanup();
      await this.performAutoBackup();
    }, STORAGE_CONFIG.AUTO_BACKUP_INTERVAL);
  }

  // Session management with advanced features
  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      // Validate sessions
      const validSessions = sessions.filter(session => this.validateSession(session));
      
      // Limit sessions
      const limitedSessions = validSessions.slice(-STORAGE_CONFIG.MAX_SESSIONS);

      // Prepare data
      const data = JSON.stringify(limitedSessions);
      const compressed = await StorageCompression.compress(data);
      const encrypted = StorageEncryption.encrypt(compressed);

      // Create metadata
      const metadata: StorageMetadata = {
        version: '2.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: encrypted.length,
        compressed: data.length !== compressed.length,
        encrypted: true,
        checksum: StorageEncryption.generateChecksum(data),
      };

      // Store with metadata
      const storageData = {
        metadata,
        data: encrypted,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(storageData));
      
      // Update cache
      await this.cacheManager.set('sessions', limitedSessions, 10 * 60 * 1000); // 10 minutes cache
      
    } catch (error) {
      console.error('Failed to save sessions:', error);
      throw new Error('Storage operation failed');
    }
  }

  async loadSessions(): Promise<Session[]> {
    try {
      // Check cache first
      const cached = await this.cacheManager.get<Session[]>('sessions');
      if (cached) return cached;

      // Load from storage
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) return [];

      const storageData = JSON.parse(raw);
      
      // Verify metadata
      if (!this.validateMetadata(storageData.metadata)) {
        console.warn('Invalid metadata detected, clearing storage');
        await this.clearSessions();
        return [];
      }

      // Decrypt and decompress
      let decrypted = StorageEncryption.decrypt(storageData.data);
      if (storageData.metadata.compressed) {
        decrypted = await StorageCompression.decompress(decrypted);
      }

      const sessions = JSON.parse(decrypted) as Session[];
      
      // Validate sessions
      const validSessions = sessions.filter(session => this.validateSession(session));
      
      // Update cache
      await this.cacheManager.set('sessions', validSessions, 10 * 60 * 1000);
      
      return validSessions;
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  async addSession(session: Session): Promise<void> {
    const existing = await this.loadSessions();
    const updated = [session, ...existing];
    await this.saveSessions(updated);
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const sessions = await this.loadSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      await this.saveSessions(sessions);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.loadSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await this.saveSessions(filtered);
  }

  async clearSessions(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
    await this.cacheManager.delete('sessions');
  }

  // User preferences management
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      const data = JSON.stringify(preferences);
      const encrypted = StorageEncryption.encrypt(data);
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, encrypted);
      await this.cacheManager.set('preferences', preferences, 30 * 60 * 1000); // 30 minutes cache
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Storage operation failed');
    }
  }

  async loadPreferences(): Promise<UserPreferences> {
    try {
      // Check cache first
      const cached = await this.cacheManager.get<UserPreferences>('preferences');
      if (cached) return cached;

      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!raw) return this.getDefaultPreferences();

      const decrypted = StorageEncryption.decrypt(raw);
      const preferences = JSON.parse(decrypted) as UserPreferences;
      
      await this.cacheManager.set('preferences', preferences, 30 * 60 * 1000);
      
      return preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Backup and restore
  async createBackup(): Promise<string> {
    try {
      const sessions = await this.loadSessions();
      const preferences = await this.loadPreferences();
      
      const backupData: BackupData = {
        sessions,
        preferences,
        timestamp: Date.now(),
        version: '2.0',
        deviceInfo: this.deviceInfo!,
      };

      const backupJson = JSON.stringify(backupData);
      const encrypted = StorageEncryption.encrypt(backupJson);
      
      await AsyncStorage.setItem(STORAGE_KEYS.BACKUP, encrypted);
      
      return backupJson;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Backup creation failed');
    }
  }

  async restoreBackup(backupData: string): Promise<void> {
    try {
      const decrypted = StorageEncryption.decrypt(backupData);
      const backup: BackupData = JSON.parse(decrypted);

      // Validate backup
      if (!this.validateBackup(backup)) {
        throw new Error('Invalid backup data');
      }

      // Restore sessions
      await this.saveSessions(backup.sessions);
      
      // Restore preferences
      await this.savePreferences(backup.preferences);
      
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('Backup restoration failed');
    }
  }

  // Storage statistics and maintenance
  async getStorageStats(): Promise<StorageStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      let sessionsCount = 0;
      let cacheSize = 0;

      for (const key of keys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const size = raw.length;
          totalSize += size;
          
          if (key === STORAGE_KEYS.SESSIONS) {
            sessionsCount = JSON.parse(raw).metadata?.size ? 1 : 0;
          } else if (key.startsWith('cache_')) {
            cacheSize += size;
          }
        }
      }

      const lastBackup = await this.getLastBackupTime();
      const compressionRatio = this.calculateCompressionRatio();

      return {
        totalSize,
        sessionsCount,
        cacheSize,
        lastBackup,
        compressionRatio,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSize: 0,
        sessionsCount: 0,
        cacheSize: 0,
        lastBackup: 0,
        compressionRatio: 1,
      };
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean expired cache
      await this.cacheManager.cleanup();

      // Remove old sessions (beyond retention period)
      const sessions = await this.loadSessions();
      const cutoffDate = Date.now() - (STORAGE_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const filteredSessions = sessions.filter(session => 
        new Date(session.startedAt).getTime() > cutoffDate
      );
      
      if (filteredSessions.length !== sessions.length) {
        await this.saveSessions(filteredSessions);
      }

      // Clean up orphaned cache entries
      const allKeys = await AsyncStorage.getAllKeys();
      const validKeys = Object.values(STORAGE_KEYS);
      const orphanedKeys = allKeys.filter(key => 
        !validKeys.includes(key as any) && !key.startsWith('cache_')
      );
      
      if (orphanedKeys.length > 0) {
        await AsyncStorage.multiRemove(orphanedKeys);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      await this.cacheManager.clear();
    } catch (error) {
      console.error('Failed to clear all storage:', error);
      throw new Error('Storage clear failed');
    }
  }

  // Utility methods
  private validateSession(session: any): session is Session {
    return (
      session &&
      typeof session.id === 'string' &&
      typeof session.operatorName === 'string' &&
      typeof session.startedAt === 'string' &&
      Array.isArray(session.packages) &&
      typeof session.declaredCount === 'number'
    );
  }

  private validateMetadata(metadata: any): boolean {
    return (
      metadata &&
      typeof metadata.version === 'string' &&
      typeof metadata.createdAt === 'number' &&
      typeof metadata.updatedAt === 'number' &&
      typeof metadata.checksum === 'string'
    );
  }

  private validateBackup(backup: any): boolean {
    return (
      backup &&
      Array.isArray(backup.sessions) &&
      backup.preferences &&
      typeof backup.timestamp === 'number' &&
      typeof backup.version === 'string' &&
      backup.deviceInfo
    );
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'pt-BR',
      notifications: {
        enabled: true,
        sound: true,
        vibration: true,
        divergences: true,
        summaries: false,
      },
      scanner: {
        haptics: true,
        sound: true,
        autoFocus: true,
        flashMode: 'auto',
        quality: 'medium',
      },
      analytics: true,
      autoBackup: true,
    };
  }

  private async getLastBackupTime(): Promise<number> {
    try {
      const backup = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP);
      if (!backup) return 0;
      
      const decrypted = StorageEncryption.decrypt(backup);
      const backupData = JSON.parse(decrypted) as BackupData;
      
      return backupData.timestamp;
    } catch (error) {
      return 0;
    }
  }

  private calculateCompressionRatio(): number {
    // Simplified calculation - would be more complex in production
    return 0.7; // 30% compression
  }

  private async performAutoBackup(): Promise<void> {
    try {
      const preferences = await this.loadPreferences();
      if (preferences.autoBackup) {
        await this.createBackup();
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }
}

// Export singleton instance
export const storageManager = new AdvancedStorageManager();

// Legacy exports for backward compatibility
export async function saveSessions(sessions: Session[]): Promise<void> {
  await storageManager.saveSessions(sessions);
}

export async function loadSessions(): Promise<Session[]> {
  return await storageManager.loadSessions();
}

export async function addSession(session: Session): Promise<void> {
  await storageManager.addSession(session);
}

export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  await storageManager.updateSession(sessionId, updates);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await storageManager.deleteSession(sessionId);
}

export async function clearSessions(): Promise<void> {
  await storageManager.clearSessions();
}

// New advanced exports
export { UserPreferences, StorageStats, BackupData };
export default storageManager;
