/**
 * Sentry Client Configuration
 *
 * Monitors errors in the browser/client-side code.
 * Configured with privacy-first settings for GDPR compliance.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Replay session for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true, // GDPR: Mask all text
      blockAllMedia: true, // GDPR: Block images/videos
    }),
  ],

  // Privacy & GDPR Compliance
  beforeSend(event, hint) {
    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Remove email addresses
          const sanitizedData = { ...breadcrumb.data };
          Object.keys(sanitizedData).forEach((key) => {
            if (
              key.toLowerCase().includes('email') ||
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('token')
            ) {
              sanitizedData[key] = '[Filtered]';
            }
          });
          breadcrumb.data = sanitizedData;
        }
        return breadcrumb;
      });
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['set-cookie'];
    }

    // Remove query parameters that might contain tokens
    if (event.request?.query_string) {
      const params = new URLSearchParams(event.request.query_string);
      if (params.has('token')) params.set('token', '[Filtered]');
      if (params.has('email')) params.set('email', '[Filtered]');
      event.request.query_string = params.toString();
    }

    return event;
  },

  // Ignore common errors that don't need tracking
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'NetworkError',
    'Network request failed',
    // Aborted requests
    'AbortError',
    'The user aborted a request',
  ],
});
