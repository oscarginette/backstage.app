/**
 * Sentry Utilities
 * Helper functions for tracking errors and performance
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Track database query performance
 * Usage: await trackQuery('getUserById', () => db.user.findById(id))
 */
export async function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'db.query',
      name: queryName,
      attributes: metadata,
    },
    async () => {
      try {
        return await queryFn();
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            query: queryName,
            database: 'postgres',
          },
          contexts: {
            query: metadata,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track external API calls
 * Usage: await trackApiCall('soundcloud', 'getTracks', () => fetch(...))
 */
export async function trackApiCall<T>(
  service: string,
  operation: string,
  apiFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `${service}.${operation}`,
      attributes: {
        service,
        operation,
        ...metadata,
      },
    },
    async () => {
      try {
        return await apiFn();
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            service,
            operation,
          },
          contexts: {
            api: {
              service,
              operation,
              ...metadata,
            },
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Track business logic operations
 * Usage: await trackOperation('send-campaign', async () => { ... })
 */
export async function trackOperation<T>(
  operationName: string,
  operationFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: 'function',
      name: operationName,
      attributes: metadata,
    },
    async () => {
      try {
        return await operationFn();
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: operationName,
          },
          contexts: {
            operation: metadata,
          },
        });
        throw error;
      }
    }
  );
}

/**
 * Capture a message with context
 * Usage: logInfo('Campaign sent', { campaignId: 123, recipients: 50 })
 */
export function logInfo(message: string, context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level: 'info',
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a warning
 * Usage: logWarning('API rate limit approaching', { remaining: 10 })
 */
export function logWarning(message: string, context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level: 'warning',
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture an error with additional context
 * Usage: captureError(error, { userId: 123, action: 'sendEmail' })
 */
export function captureError(
  error: Error,
  context?: {
    userId?: number;
    action?: string;
    metadata?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    user: context?.userId ? { id: String(context.userId) } : undefined,
    tags: {
      action: context?.action,
    },
    contexts: {
      custom: context?.metadata,
    },
  });
}

/**
 * Set user context (call after authentication)
 * Usage: setUser({ id: 123, email: 'user@example.com' })
 */
export function setUser(user: { id: number; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: String(user.id),
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * Usage: addBreadcrumb('User clicked send button', { campaignId: 123 })
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}
