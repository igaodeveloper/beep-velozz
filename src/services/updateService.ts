import * as Updates from 'expo-updates';
import { captureMessage } from '../utils/sentry';
import { analytics } from './analyticsService';

export class UpdateService {
  static async checkForUpdates() {
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          analytics.trackEvent({
            name: 'update_available',
            properties: {
              current_version: Updates.runtimeVersion,
              new_version: (update.manifest as any)?.version || 'unknown',
            },
          });

          return {
            available: true,
            manifest: update.manifest,
          };
        }
      }

      return { available: false };
    } catch (error) {
      captureMessage('Update check failed', 'error', { error });
      return { available: false, error };
    }
  }

  static async downloadAndInstallUpdate() {
    try {
      if (!__DEV__) {
        const update = await Updates.fetchUpdateAsync();

        if (update.isNew) {
          analytics.trackEvent({
            name: 'update_downloaded',
            properties: {
              version: Updates.runtimeVersion,
            },
          });

          await Updates.reloadAsync();

          return { success: true };
        }
      }

      return { success: false, reason: 'No update available' };
    } catch (error) {
      captureMessage('Update installation failed', 'error', { error });
      return { success: false, error };
    }
  }

  static getCurrentVersion() {
    return Updates.runtimeVersion;
  }

  static getUpdateId() {
    return Updates.updateId;
  }

  static getChannel() {
    return Updates.channel;
  }

  // Listen for update events
  static addUpdateListener(callback: (event: any) => void) {
    // Disabled due to API changes
    return null;
  }
}