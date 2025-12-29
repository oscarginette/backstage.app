/**
 * Sentry Integration Helpers
 *
 * Utility functions to simplify Sentry integration in use cases.
 * Provides GDPR-compliant error tracking and performance monitoring.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Options for tracking use case execution
 */
export interface TrackUseCaseOptions {
  name: string;
  userId?: number;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
}

/**
 * Track use case execution with Sentry
 *
 * Usage:
 * ```typescript
 * async execute(input: MyInput): Promise<MyResult> {
 *   return trackUseCase(
 *     {
 *       name: 'MyUseCase',
 *       userId: input.userId,
 *       context: { operationType: 'create' },
 *       tags: { module: 'contacts' },
 *     },
 *     async () => {
 *       // Your business logic here
 *       return result;
 *     }
 *   );
 * }
 * ```
 */
export async function trackUseCase<T>(
  options: TrackUseCaseOptions,
  execution: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      op: 'use-case',
      name: options.name,
    },
    async () => {
      try {
        // Add context
        if (options.context) {
          Sentry.setContext(options.name, {
            ...options.context,
            timestamp: new Date().toISOString(),
          });
        }

        // Add tags
        if (options.tags) {
          Object.entries(options.tags).forEach(([key, value]) => {
            Sentry.setTag(key, value);
          });
        }

        // Add user ID if provided
        if (options.userId) {
          Sentry.setUser({ id: options.userId.toString() });
        }

        // Execute business logic
        const result = await execution();

        return result;
      } catch (error) {
        // Capture error to Sentry
        Sentry.captureException(error, {
          tags: {
            useCase: options.name,
            ...(options.userId && { userId: options.userId.toString() }),
            ...options.tags,
          },
          extra: {
            context: options.context,
          },
        });

        throw error;
      }
    }
  );
}

/**
 * Sanitize data to remove PII before sending to Sentry
 *
 * Usage:
 * ```typescript
 * Sentry.captureException(error, {
 *   extra: {
 *     input: sanitizeForSentry(input),
 *   },
 * });
 * ```
 */
export function sanitizeForSentry(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForSentry(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Filter out sensitive fields (GDPR compliance)
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('ssn') ||
        lowerKey.includes('creditcard') ||
        lowerKey.includes('credit_card')
      ) {
        sanitized[key] = '[Filtered]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeForSentry(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Track custom measurements (performance metrics)
 *
 * Usage:
 * ```typescript
 * trackMeasurement('import_duration_ms', 5000);
 * trackMeasurement('contacts_inserted', 150);
 * ```
 */
export function trackMeasurement(name: string, value: number, unit?: string): void {
  Sentry.setMeasurement(name, value, unit || 'none');
}

/**
 * Capture a warning message (non-error)
 *
 * Usage:
 * ```typescript
 * captureWarning('Email log not found', {
 *   emailId: 'abc123',
 *   webhookType: 'email.delivered',
 * });
 * ```
 */
export function captureWarning(
  message: string,
  extra?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, 'warning');
  if (extra) {
    Sentry.setContext('warning_context', sanitizeForSentry(extra) as Record<string, unknown>);
  }
}

/**
 * Capture an info message
 *
 * Usage:
 * ```typescript
 * captureInfo('Unhandled webhook type', {
 *   webhookType: 'custom.event',
 * });
 * ```
 */
export function captureInfo(
  message: string,
  extra?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, 'info');
  if (extra) {
    Sentry.setContext('info_context', sanitizeForSentry(extra) as Record<string, unknown>);
  }
}

/**
 * Manually capture an exception with context
 *
 * Usage:
 * ```typescript
 * captureError(error, {
 *   tags: { module: 'contacts' },
 *   extra: { userId: 123, operation: 'import' },
 * });
 * ```
 */
export function captureError(
  error: unknown,
  options?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    userId?: number;
  }
): void {
  if (options?.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  if (options?.extra) {
    Sentry.setContext('error_context', sanitizeForSentry(options.extra) as Record<string, unknown>);
  }

  if (options?.userId) {
    Sentry.setUser({ id: options.userId.toString() });
  }

  Sentry.captureException(error);
}

/**
 * Add breadcrumb for tracking user actions
 *
 * Usage:
 * ```typescript
 * addBreadcrumb('User clicked import button', {
 *   userId: 123,
 *   fileType: 'csv',
 * });
 * ```
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    data: data ? (sanitizeForSentry(data) as Record<string, unknown>) : undefined,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}
