/**
 * Sentry Edge Runtime Configuration
 *
 * Monitors errors in Edge Runtime (middleware, edge API routes).
 * Lightweight configuration suitable for edge environments.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Privacy & GDPR Compliance
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['set-cookie'];
    }

    return event;
  },
});
