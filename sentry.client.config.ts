import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client Configuration
 * Runs in the browser - captures client-side errors
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // 100% of errors captured
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1, // 1% in prod, 10% in dev

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Trace propagation for distributed tracing
  tracePropagationTargets: ['localhost', /^\//],

  // Ignore known browser extensions and common errors
  ignoreErrors: [
    // Browser extension errors
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Ad blockers
    'AdBlocker',
  ],

  // Before sending, filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event (dev):', event);
      return null;
    }

    // Filter out any PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Remove email/password from form data
          delete breadcrumb.data.email;
          delete breadcrumb.data.password;
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
