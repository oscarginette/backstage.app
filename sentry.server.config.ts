/**
 * Sentry Server Configuration
 *
 * Monitors errors in server-side code (API routes, server components, middleware).
 * Configured with GDPR-compliant data sanitization.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Server-side integrations
  integrations: [
    // HTTP tracking for API requests
    Sentry.httpIntegration(),
  ],

  // Privacy & GDPR Compliance
  beforeSend(event, hint) {
    // Remove sensitive data from request
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['set-cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        const sensitiveParams = ['token', 'email', 'password', 'apiKey', 'secret'];
        sensitiveParams.forEach((param) => {
          if (params.has(param)) {
            params.set(param, '[Filtered]');
          }
        });
        event.request.query_string = params.toString();
      }

      // Sanitize request body
      if (event.request.data) {
        event.request.data = sanitizeData(event.request.data);
      }
    }

    // Sanitize extra context
    if (event.extra) {
      event.extra = sanitizeData(event.extra) as Record<string, unknown>;
    }

    // Sanitize contexts
    if (event.contexts) {
      Object.keys(event.contexts).forEach((key) => {
        const sanitized = sanitizeData(event.contexts![key]);
        if (sanitized && typeof sanitized === 'object') {
          event.contexts![key] = sanitized as Record<string, unknown>;
        }
      });
    }

    return event;
  },

  // Ignore common errors
  ignoreErrors: [
    // Database connection timeouts (handled by infrastructure)
    'ECONNREFUSED',
    'ENOTFOUND',
    // Client disconnections
    'ECONNRESET',
    'socket hang up',
  ],
});

/**
 * Sanitize data to remove PII (Personal Identifiable Information)
 * GDPR compliant data filtering
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Filter out sensitive fields
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        sanitized[key] = '[Filtered]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return data;
}
