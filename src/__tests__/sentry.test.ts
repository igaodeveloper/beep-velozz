import { SentryService } from '../../services/sentry';

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn(),
  configureScope: jest.fn(),
  startTransaction: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
}));

import * as Sentry from '@sentry/react-native';

const mockSentry = Sentry as jest.Mocked<typeof Sentry>;

describe('SentryService', () => {
  let sentryService: SentryService;

  beforeEach(() => {
    sentryService = SentryService.getInstance();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Sentry with correct config', () => {
      SentryService.initialize({
        dsn: 'test-dsn',
        environment: 'test',
        release: '1.0.0',
      });

      expect(mockSentry.init).toHaveBeenCalledWith({
        dsn: 'test-dsn',
        environment: 'test',
        release: '1.0.0',
        enableTracing: true,
        tracesSampleRate: 0.1,
        integrations: expect.any(Array),
        beforeSend: expect.any(Function),
      });
    });
  });

  describe('Error Tracking', () => {
    it('should capture exception', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'scan' };

      sentryService.captureException(error, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture message', () => {
      const message = 'Test message';
      const level = 'warning' as const;

      sentryService.captureMessage(message, level);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, level);
    });
  });

  describe('User Context', () => {
    it('should set user context', () => {
      const user = {
        id: 'user123',
        email: 'user@example.com',
        username: 'testuser',
      };

      sentryService.setUser(user);

      expect(mockSentry.setUser).toHaveBeenCalledWith(user);
    });

    it('should set context', () => {
      const context = {
        app: {
          version: '1.0.0',
          build: '123',
        },
        device: {
          model: 'iPhone12',
          os: 'iOS 15.0',
        },
      };

      sentryService.setContext('app', context.app);
      sentryService.setContext('device', context.device);

      expect(mockSentry.setContext).toHaveBeenCalledWith('app', context.app);
      expect(mockSentry.setContext).toHaveBeenCalledWith('device', context.device);
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumb', () => {
      const breadcrumb = {
        message: 'User scanned barcode',
        category: 'user_action',
        level: 'info' as const,
        data: { barcode: '123456789' },
      };

      sentryService.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should add navigation breadcrumb', () => {
      sentryService.addNavigationBreadcrumb('HomeScreen', 'ScannerScreen');

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Navigation: HomeScreen -> ScannerScreen',
        category: 'navigation',
        level: 'info',
      });
    });

    it('should add scan breadcrumb', () => {
      const scanData = {
        barcode: '123456789',
        type: 'ean13',
        success: true,
      };

      sentryService.addScanBreadcrumb(scanData);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Barcode scanned: 123456789 (ean13)',
        category: 'scan',
        level: 'info',
        data: scanData,
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should start transaction', () => {
      const mockTransaction = {
        startChild: jest.fn(),
        setTag: jest.fn(),
        setData: jest.fn(),
        finish: jest.fn(),
      };

      mockSentry.startTransaction.mockReturnValue(mockTransaction);

      const transaction = sentryService.startTransaction('scan_operation', 'task');

      expect(mockSentry.startTransaction).toHaveBeenCalledWith('scan_operation', 'task');
      expect(transaction).toBe(mockTransaction);
    });

    it('should measure performance', async () => {
      const mockTransaction = {
        startChild: jest.fn().mockReturnValue({
          setTag: jest.fn(),
          setData: jest.fn(),
          finish: jest.fn(),
        }),
        setTag: jest.fn(),
        setData: jest.fn(),
        finish: jest.fn(),
      };

      mockSentry.startTransaction.mockReturnValue(mockTransaction);

      const operation = sentryService.measurePerformance('barcode_processing');

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      operation.finish();

      expect(mockSentry.startTransaction).toHaveBeenCalledWith('barcode_processing', 'task');
      expect(mockTransaction.startChild).toHaveBeenCalledWith('barcode_processing', 'task');
    });
  });

  describe('Tags and Extras', () => {
    it('should set tag', () => {
      sentryService.setTag('environment', 'production');

      expect(mockSentry.setTag).toHaveBeenCalledWith('environment', 'production');
    });

    it('should set extra data', () => {
      const extraData = { apiVersion: 'v2', featureFlags: ['new_scanner'] };

      sentryService.setExtra('config', extraData);

      expect(mockSentry.setExtra).toHaveBeenCalledWith('config', extraData);
    });
  });

  describe('Error Boundary Integration', () => {
    it('should provide error boundary component', () => {
      const ErrorBoundary = sentryService.getErrorBoundary();

      expect(ErrorBoundary).toBeDefined();
      expect(typeof ErrorBoundary).toBe('function');
    });

    it('should wrap component with error boundary', () => {
      const TestComponent = () => null;
      const WrappedComponent = sentryService.withErrorBoundary(TestComponent, 'TestComponent');

      expect(WrappedComponent).toBeDefined();
      expect(typeof WrappedComponent).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should configure scope', () => {
      const configCallback = jest.fn();

      sentryService.configureScope(configCallback);

      expect(mockSentry.configureScope).toHaveBeenCalledWith(configCallback);
    });

    it('should flush pending events', async () => {
      // Mock flush method
      mockSentry.flush = jest.fn().mockResolvedValue(true);

      const result = await sentryService.flush();

      expect(mockSentry.flush).toHaveBeenCalledWith(2000);
      expect(result).toBe(true);
    });
  });
});