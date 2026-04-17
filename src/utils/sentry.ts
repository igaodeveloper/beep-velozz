import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Initialize Sentry
export const initSentry = () => {
  if (!__DEV__) {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'production',
      release: Constants.nativeAppVersion,
      dist: Constants.nativeBuildVersion,

      // Performance monitoring
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,

      // Error tracking
      beforeSend: (event) => {
        // Filter out development errors
        if (event.exception) {
          console.log('Sentry Error:', event.exception);
        }
        return event;
      },

      // Integrations
      integrations: [
        // Removed tracing integration due to version mismatch
      ],
    });

    // Set user context
    Sentry.setUser({
      id: 'anonymous', // Will be set when user logs in
    });

    // Set tags
    Sentry.setTag('app_version', Constants.nativeAppVersion);
    Sentry.setTag('build_version', Constants.nativeBuildVersion);
    Sentry.setTag('platform', String(Constants.platform));
  }
};

// Performance monitoring
export const startTransaction = (name: string, op: string) => {
  // Disabled due to API changes
  return null;
};

// Error tracking
export const captureException = (error: Error, context?: any) => {
  if (!__DEV__) {
    Sentry.captureException(error, {
      tags: context,
    });
  } else {
    console.error('Error captured:', error, context);
  }
};

// User feedback
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: any) => {
  if (!__DEV__) {
    Sentry.captureMessage(message, { level, tags: context });
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
};

// Performance metrics
export const addBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel) => {
  if (!__DEV__) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: level || 'info',
    });
  }
};