import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server Configuration
 * Runs on Next.js server - captures API route errors
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Database instrumentation
  integrations: [
    Sentry.prismaIntegration(), // Si usas Prisma
    Sentry.postgresIntegration(), // Para Postgres
  ],

  // Before sending, enrich events with server context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry server event (dev):', event);
      return null;
    }

    // Add server metadata
    event.tags = {
      ...event.tags,
      server: 'vercel',
      region: process.env.VERCEL_REGION || 'unknown',
    };

    // Filter sensitive data from request
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'password', 'api_key'];
        sensitiveParams.forEach((param) => {
          event.request.query_string = event.request.query_string?.replace(
            new RegExp(`${param}=[^&]*`, 'gi'),
            `${param}=REDACTED`
          );
        });
      }
    }

    return event;
  },
});
