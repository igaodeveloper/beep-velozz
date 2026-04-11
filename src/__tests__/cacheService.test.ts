import { CacheService } from "../../services/cacheService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("CacheService", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    jest.clearAllMocks();
  });

  describe("Basic Operations", () => {
    it("should set and get data", async () => {
      const testData = { message: "hello world" };
      const key = "test_key";

      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await cacheService.set(key, testData);
      const result = await cacheService.get(key);

      expect(result).toEqual(testData);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `cache_${key}`,
        expect.any(String),
      );
    });

    it("should return null for expired data", async () => {
      const testData = { message: "expired" };
      const key = "expired_key";

      // Set data with very short TTL
      await cacheService.set(key, testData, 1); // 1ms TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it("should delete data", async () => {
      const key = "delete_key";
      const testData = { message: "to be deleted" };

      await cacheService.set(key, testData);
      await cacheService.delete(key);

      const result = await cacheService.get(key);
      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(`cache_${key}`);
    });
  });

  describe("Specialized Methods", () => {
    it("should handle pricing data", async () => {
      const pricingData = {
        shopee: 6,
        mercado_livre: 8,
        avulso: 5,
      };

      await cacheService.setPricingData(pricingData);
      const result = await cacheService.getPricingData();

      expect(result).toEqual(pricingData);
    });

    it("should handle user preferences", async () => {
      const preferences = {
        theme: "dark",
        language: "pt",
        soundEnabled: true,
      };

      await cacheService.setUserPreferences(preferences);
      const result = await cacheService.getUserPreferences();

      expect(result).toEqual(preferences);
    });

    it("should handle session history", async () => {
      const history = [
        { id: "1", date: "2024-01-01", packages: 10 },
        { id: "2", date: "2024-01-02", packages: 15 },
      ];

      await cacheService.setSessionHistory(history);
      const result = await cacheService.getSessionHistory();

      expect(result).toEqual(history);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup expired items", async () => {
      const expiredKey = "expired";
      const validKey = "valid";

      // Set expired data
      await cacheService.set(expiredKey, { data: "expired" }, 1);
      await cacheService.set(validKey, { data: "valid" }, 24 * 60 * 60 * 1000); // 24 hours

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockAsyncStorage.getAllKeys.mockResolvedValue([
        `cache_${expiredKey}`,
        `cache_${validKey}`,
      ]);
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === `cache_${expiredKey}`) {
          return Promise.resolve(
            JSON.stringify({
              data: { data: "expired" },
              timestamp: Date.now() - 1000,
              ttl: 1,
            }),
          );
        }
        if (key === `cache_${validKey}`) {
          return Promise.resolve(
            JSON.stringify({
              data: { data: "valid" },
              timestamp: Date.now(),
              ttl: 24 * 60 * 60 * 1000,
            }),
          );
        }
        return Promise.resolve(null);
      });

      await cacheService.cleanup();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        `cache_${expiredKey}`,
      );
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith(
        `cache_${validKey}`,
      );
    });
  });
});
