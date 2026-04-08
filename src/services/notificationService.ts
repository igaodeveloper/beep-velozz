import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { captureMessage } from './sentry';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task for notifications
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    // Handle background notifications
    const receivedNotifications = await Notifications.getPresentedNotificationsAsync();

    for (const notification of receivedNotifications) {
      // Process notification data
      console.log('Background notification:', notification);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    captureMessage('Background notification task failed', 'error', { error });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background task
BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
  minimumInterval: 60 * 15, // 15 minutes
  stopOnTerminate: false,
  startOnBoot: true,
});

export class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }

  static async scheduleSessionReminder(sessionId: string, minutesFromNow: number = 30) {
    const trigger = new Date(Date.now() + minutesFromNow * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sessão ativa',
        body: 'Você tem uma sessão de escaneamento em andamento',
        data: { sessionId, type: 'session_reminder' },
      },
      trigger,
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  // Listen for notification responses
  static addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for received notifications
  static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}