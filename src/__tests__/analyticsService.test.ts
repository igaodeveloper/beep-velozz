import { AnalyticsService } from "../../services/analyticsService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("AnalyticsService", () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = AnalyticsService.getInstance();
    jest.clearAllMocks();
  });

  describe("Event Tracking", () => {
    it("should track scan events", async () => {
      const scanData = {
        barcode: "123456789",
        type: "ean13",
        timestamp: Date.now(),
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await analyticsService.trackScan(scanData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = mockAsyncStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);

      expect(storedData.events).toHaveLength(1);
      expect(storedData.events[0].event).toBe("scan");
      expect(storedData.events[0].data).toEqual(scanData);
    });

    it("should track session events", async () => {
      const sessionData = {
        sessionId: "session_123",
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        totalScans: 50,
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await analyticsService.trackSession(sessionData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = mockAsyncStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);

      expect(storedData.events).toHaveLength(1);
      expect(storedData.events[0].event).toBe("session");
      expect(storedData.events[0].data).toEqual(sessionData);
    });

    it("should track error events", async () => {
      const errorData = {
        error: "Camera permission denied",
        context: "scanner",
        timestamp: Date.now(),
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await analyticsService.trackError(errorData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = mockAsyncStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);

      expect(storedData.events).toHaveLength(1);
      expect(storedData.events[0].event).toBe("error");
      expect(storedData.events[0].data).toEqual(errorData);
    });
  });

  describe("Analytics Retrieval", () => {
    it("should get analytics data", async () => {
      const mockAnalyticsData = {
        events: [
          {
            event: "scan",
            data: { barcode: "123456789" },
            timestamp: Date.now(),
          },
        ],
        lastSync: null,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(mockAnalyticsData),
      );

      const result = await analyticsService.getAnalytics();

      expect(result).toEqual(mockAnalyticsData);
    });

    it("should return default data when no stored data", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await analyticsService.getAnalytics();

      expect(result.events).toEqual([]);
      expect(result.lastSync).toBeNull();
    });
  });

  describe("Data Synchronization", () => {
    it("should sync data to server", async () => {
      const mockAnalyticsData = {
        events: [
          {
            event: "scan",
            data: { barcode: "123456789" },
            timestamp: Date.now(),
          },
        ],
        lastSync: null,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(mockAnalyticsData),
      );
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await analyticsService.syncToServer();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/analytics/sync"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        }),
      );
    });

    it("should handle sync failure", async () => {
      const mockAnalyticsData = {
        events: [],
        lastSync: null,
      };

      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(mockAnalyticsData),
      );

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await analyticsService.syncToServer();

      expect(result).toBe(false);
    });
  });

  describe("Performance Metrics", () => {
    it("should track performance metrics", async () => {
      const metrics = {
        scanTime: 150,
        processingTime: 50,
        memoryUsage: 25.5,
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await analyticsService.trackPerformance(metrics);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = mockAsyncStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);

      expect(storedData.events).toHaveLength(1);
      expect(storedData.events[0].event).toBe("performance");
      expect(storedData.events[0].data).toEqual(metrics);
    });
  });
});
