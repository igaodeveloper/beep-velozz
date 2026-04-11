import { UpdateService } from "../../services/updateService";

// Mock Expo Updates
jest.mock("expo-updates", () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  updateId: "test-update-id",
  createdAt: new Date(),
  runtimeVersion: "1.0.0",
}));

import * as Updates from "expo-updates";

const mockUpdates = Updates as jest.Mocked<typeof Updates>;

describe("UpdateService", () => {
  let updateService: UpdateService;

  beforeEach(() => {
    updateService = UpdateService.getInstance();
    jest.clearAllMocks();
  });

  describe("Update Checking", () => {
    it("should check for updates successfully", async () => {
      const mockUpdateInfo = {
        isAvailable: true,
        manifest: {
          version: "1.1.0",
          description: "New features added",
        },
      };

      mockUpdates.checkForUpdateAsync.mockResolvedValue(mockUpdateInfo);

      const result = await updateService.checkForUpdates();

      expect(result).toEqual(mockUpdateInfo);
      expect(mockUpdates.checkForUpdateAsync).toHaveBeenCalled();
    });

    it("should handle no updates available", async () => {
      const mockUpdateInfo = {
        isAvailable: false,
      };

      mockUpdates.checkForUpdateAsync.mockResolvedValue(mockUpdateInfo);

      const result = await updateService.checkForUpdates();

      expect(result.isAvailable).toBe(false);
      expect(mockUpdates.checkForUpdateAsync).toHaveBeenCalled();
    });

    it("should handle update check errors", async () => {
      mockUpdates.checkForUpdateAsync.mockRejectedValue(
        new Error("Network error"),
      );

      const result = await updateService.checkForUpdates();

      expect(result).toEqual({
        isAvailable: false,
        error: "Network error",
      });
    });
  });

  describe("Update Fetching", () => {
    it("should fetch update successfully", async () => {
      mockUpdates.fetchUpdateAsync.mockResolvedValue({
        isNew: true,
        manifest: {
          version: "1.1.0",
        },
      });

      const result = await updateService.fetchUpdate();

      expect(result.isNew).toBe(true);
      expect(mockUpdates.fetchUpdateAsync).toHaveBeenCalled();
    });

    it("should handle fetch update errors", async () => {
      mockUpdates.fetchUpdateAsync.mockRejectedValue(
        new Error("Download failed"),
      );

      const result = await updateService.fetchUpdate();

      expect(result).toEqual({
        isNew: false,
        error: "Download failed",
      });
    });
  });

  describe("Update Application", () => {
    it("should reload app after update", async () => {
      mockUpdates.reloadAsync.mockResolvedValue(undefined);

      await updateService.reloadApp();

      expect(mockUpdates.reloadAsync).toHaveBeenCalled();
    });

    it("should handle reload errors", async () => {
      mockUpdates.reloadAsync.mockRejectedValue(new Error("Reload failed"));

      await expect(updateService.reloadApp()).rejects.toThrow("Reload failed");
    });
  });

  describe("Automatic Updates", () => {
    it("should perform automatic update check and fetch", async () => {
      const mockUpdateInfo = {
        isAvailable: true,
        manifest: {
          version: "1.1.0",
        },
      };

      mockUpdates.checkForUpdateAsync.mockResolvedValue(mockUpdateInfo);
      mockUpdates.fetchUpdateAsync.mockResolvedValue({
        isNew: true,
        manifest: {
          version: "1.1.0",
        },
      });

      const result = await updateService.performAutomaticUpdate();

      expect(result.success).toBe(true);
      expect(result.updateFetched).toBe(true);
      expect(mockUpdates.checkForUpdateAsync).toHaveBeenCalled();
      expect(mockUpdates.fetchUpdateAsync).toHaveBeenCalled();
    });

    it("should handle automatic update when no update available", async () => {
      const mockUpdateInfo = {
        isAvailable: false,
      };

      mockUpdates.checkForUpdateAsync.mockResolvedValue(mockUpdateInfo);

      const result = await updateService.performAutomaticUpdate();

      expect(result.success).toBe(true);
      expect(result.updateFetched).toBe(false);
      expect(mockUpdates.checkForUpdateAsync).toHaveBeenCalled();
      expect(mockUpdates.fetchUpdateAsync).not.toHaveBeenCalled();
    });

    it("should handle automatic update errors", async () => {
      mockUpdates.checkForUpdateAsync.mockRejectedValue(
        new Error("Check failed"),
      );

      const result = await updateService.performAutomaticUpdate();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Check failed");
    });
  });

  describe("Update Information", () => {
    it("should get current update info", () => {
      const updateInfo = updateService.getCurrentUpdateInfo();

      expect(updateInfo).toEqual({
        updateId: "test-update-id",
        createdAt: expect.any(Date),
        runtimeVersion: "1.0.0",
      });
    });

    it("should check if update is emergency", () => {
      const emergencyUpdate = {
        isEmergency: true,
        version: "1.2.0",
      };

      const isEmergency = updateService.isEmergencyUpdate(emergencyUpdate);

      expect(isEmergency).toBe(true);
    });

    it("should check if update is mandatory", () => {
      const mandatoryUpdate = {
        isMandatory: true,
        version: "1.3.0",
      };

      const isMandatory = updateService.isMandatoryUpdate(mandatoryUpdate);

      expect(isMandatory).toBe(true);
    });
  });

  describe("Update History", () => {
    beforeEach(() => {
      // Mock AsyncStorage for history
      jest.mock("@react-native-async-storage/async-storage", () => ({
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      }));
    });

    it("should save update to history", async () => {
      const {
        AsyncStorage,
      } = require("@react-native-async-storage/async-storage");
      const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

      mockAsyncStorage.setItem.mockResolvedValue(undefined);
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const updateInfo = {
        version: "1.1.0",
        description: "Bug fixes",
        timestamp: Date.now(),
      };

      await updateService.saveUpdateToHistory(updateInfo);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should get update history", async () => {
      const {
        AsyncStorage,
      } = require("@react-native-async-storage/async-storage");
      const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

      const mockHistory = [
        {
          version: "1.0.0",
          timestamp: Date.now() - 86400000,
          description: "Initial release",
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockHistory));

      const history = await updateService.getUpdateHistory();

      expect(history).toEqual(mockHistory);
    });
  });
});
