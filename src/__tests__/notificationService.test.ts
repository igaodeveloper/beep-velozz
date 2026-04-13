/// <reference types="jest" />
import { NotificationService } from '../services/notificationService';

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

import * as Notifications from 'expo-notifications';

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('NotificationService', () => {
  let notificationService: typeof NotificationService;

  beforeEach(() => {
    notificationService = NotificationService;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize notification handler', async () => {
      mockNotifications.setNotificationHandler.mockImplementation(() => {});
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        ios: { status: 'authorized' },
      });

      await notificationService.initialize();

      expect(mockNotifications.setNotificationHandler).toHaveBeenCalled();
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      mockNotifications.setNotificationHandler.mockImplementation(() => {});
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        ios: { status: 'denied' },
      });

      await notificationService.initialize();

      expect(mockNotifications.setNotificationHandler).toHaveBeenCalled();
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('Permission Management', () => {
    it('should check permissions', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        ios: { status: 'authorized' },
      });

      const hasPermission = await notificationService.checkPermissions();

      expect(hasPermission).toBe(true);
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('should request permissions', async () => {
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        ios: { status: 'authorized' },
      });

      const granted = await notificationService.requestPermissions();

      expect(granted).toBe(true);
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule scan reminder', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification_id');

      const result = await notificationService.scheduleScanReminder(10);

      expect(result).toBe('notification_id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Hora de escanear!',
          body: 'Você não escaneia há 10 minutos. Que tal verificar alguns códigos?',
          sound: 'default',
        },
        trigger: {
          seconds: 600, // 10 minutes
        },
      });
    });

    it('should schedule session summary', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification_id');

      const sessionData = {
        totalScans: 25,
        sessionTime: 1800, // 30 minutes
      };

      const result = await notificationService.scheduleSessionSummary(sessionData);

      expect(result).toBe('notification_id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Resumo da Sessão',
          body: 'Você escaneou 25 códigos em 30 minutos. Ótimo trabalho!',
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    });

    it('should schedule achievement notification', async () => {
      mockNotifications.scheduleNotificationAsync.mockResolvedValue('notification_id');

      const achievement = {
        title: 'Scanner Expert',
        description: 'Escaneou 100 códigos!',
      };

      const result = await notificationService.scheduleAchievementNotification(achievement);

      expect(result).toBe('notification_id');
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '🏆 Conquista Desbloqueada!',
          body: 'Scanner Expert: Escaneou 100 códigos!',
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    });
  });

  describe('Notification Management', () => {
    it('should cancel notification', async () => {
      const notificationId = 'test_id';

      await notificationService.cancelNotification(notificationId);

      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
    });

    it('should cancel all notifications', async () => {
      await notificationService.cancelAllNotifications();

      expect(mockNotifications.dismissAllNotificationsAsync).toHaveBeenCalled();
    });

    it('should get scheduled notifications', async () => {
      const mockScheduledNotifications = [
        {
          identifier: '1',
          content: { 
            title: 'Test', 
            body: 'Test body',
            subtitle: null,
            data: {},
            categoryIdentifier: null,
            sound: 'default',
          },
          trigger: { seconds: 300 },
        },
      ];

      mockNotifications.getAllScheduledNotificationsAsync.mockResolvedValue(mockScheduledNotifications);

      const result = await notificationService.getScheduledNotifications();

      expect(result).toEqual(mockScheduledNotifications);
      expect(mockNotifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('should add notification listeners', () => {
      const mockListener = jest.fn();

      mockNotifications.addNotificationReceivedListener.mockReturnValue({
        remove: jest.fn(),
      });
      mockNotifications.addNotificationResponseReceivedListener.mockReturnValue({
        remove: jest.fn(),
      });

      notificationService.addNotificationListeners(mockListener, mockListener);

      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should remove notification listeners', () => {
      const mockSubscription = {
        remove: jest.fn(),
      };

      mockNotifications.addNotificationReceivedListener.mockReturnValue(mockSubscription);
      mockNotifications.addNotificationResponseReceivedListener.mockReturnValue(mockSubscription);

      notificationService.addNotificationListeners(jest.fn(), jest.fn());
      notificationService.removeNotificationListeners();

      expect(mockSubscription.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe('Background Tasks', () => {
    it('should register background task', async () => {
      // Mock expo-task-manager
      jest.mock('expo-task-manager', () => ({
        defineTask: jest.fn(),
        isTaskRegisteredAsync: jest.fn().mockResolvedValue(true),
      }));

      const { TaskManager } = require('expo-task-manager');

      await notificationService.registerBackgroundTask();

      expect(TaskManager.defineTask).toHaveBeenCalledWith(
        'BACKGROUND_NOTIFICATION_TASK',
        expect.any(Function)
      );
    });
  });
});