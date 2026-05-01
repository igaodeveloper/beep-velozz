import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, CacheItem>();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      // Store in memory
      this.memoryCache.set(key, item);

      // Store in persistent storage
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      let item = this.memoryCache.get(key) as CacheItem<T> | undefined;

      if (!item) {
        // Check persistent storage
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          // Restore to memory cache
          if (item && this.isValid(item)) {
            this.memoryCache.set(key, item);
          }
        }
      }

      if (item && this.isValid(item)) {
        return item.data;
      }

      // Item expired or doesn't exist
      await this.delete(key);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const item: CacheItem = JSON.parse(stored);
          if (!this.isValid(item)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  private isValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < item.ttl;
  }

  // Specialized cache methods for common use cases
  async getPricingData(): Promise<any> {
    return this.get('pricing_data');
  }

  async setPricingData(data: any, ttl: number = 30 * 60 * 1000): Promise<void> {
    await this.set('pricing_data', data, ttl);
  }

  async getUserPreferences(): Promise<any> {
    return this.get('user_preferences');
  }

  async setUserPreferences(data: any): Promise<void> {
    await this.set('user_preferences', data, 24 * 60 * 60 * 1000); // 24 hours
  }

  async getSessionHistory(): Promise<any[]> {
    return (await this.get('session_history')) || [];
  }

  async setSessionHistory(data: any[]): Promise<void> {
    await this.set('session_history', data, 7 * 24 * 60 * 60 * 1000); // 7 days
  }
}

export const cacheService = CacheService.getInstance();