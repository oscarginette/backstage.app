/**
 * Centralized Error Handler
 *
 * Provides consistent error handling and response formatting for API routes.
 * Implements request tracking, error logging, and standardized error responses.
 *
 * Security Features:
 * - Sanitizes error messages to prevent information disclosure
 * - Hides internal error details from clients
 * - Logs full error context for debugging
 * - Maps error types to appropriate HTTP status codes
 *
 * Usage:
 *   export const POST = withErrorHandler(async (request: Request) => {
 *     // Your handler logic
 *   });
 */

import { NextResponse } from 'next/server';
import {
  AppError,
  ValidationError,
  NotFoundError,
  AccessDeniedError,
  QuotaExceededError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  DatabaseConnectionError,
  InternalServerError,
  RateLimitError,
  WebhookVerificationError,
  ExternalServiceError,
} from './errors';
import { ERROR_CATALOG, getErrorCatalogEntry, isKnownErrorCode } from './errors/error-catalog';

export interface ErrorResponse {
  error: string;
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;
}

/**
 * Sanitizes error message for client response
 *
 * Security: Don't expose internal details like database errors, stack traces, or file paths
 */
function sanitizeErrorMessage(error: AppError): string {
  const catalogEntry = getErrorCatalogEntry(error.code);

  // If error is not user-friendly, return generic message
  if (!catalogEntry.userFriendly) {
    return 'An internal error occurred. Please try again later.';
  }

  // Return the error message (already user-friendly)
  return error.message;
}

/**
 * Sanitizes error details for client response
 *
 * Security: Remove sensitive information from error details
 */
function sanitizeErrorDetails(error: AppError): unknown {
  const catalogEntry = getErrorCatalogEntry(error.code);

  // Don't expose details for internal errors
  if (!catalogEntry.userFriendly) {
    return undefined;
  }

  // For user-friendly errors, include details (already sanitized by use case)
  return error.details;
}

/**
 * Creates a standardized error response
 *
 * Handles both known AppError instances and unexpected errors.
 * All unexpected errors are logged with full context.
 * Uses error catalog for consistent error codes and messages.
 *
 * Security: Sanitizes error messages and details before sending to client
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Handle known app errors with proper status codes
  if (error instanceof AppError) {
    const catalogEntry = getErrorCatalogEntry(error.code);

    // Log known errors with context (full details for debugging)
    console.error(`[${requestId}] AppError (${error.code}):`, {
      message: error.message,
      code: error.code,
      status: error.status,
      category: catalogEntry.category,
      severity: catalogEntry.severity,
      details: error.details,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Return sanitized error to client
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error),
        code: error.code,
        status: error.status,
        details: sanitizeErrorDetails(error),
        requestId,
      },
      { status: error.status }
    );
  }

  // Handle unexpected errors (always 500)
  // Security: Never expose internal error messages to client
  const internalMessage = error instanceof Error ? error.message : 'Unknown error';

  // Log unexpected errors for monitoring and debugging (full context)
  console.error(`[${requestId}] Unexpected error:`, {
    message: internalMessage,
    stack: error instanceof Error ? error.stack : undefined,
    error: error instanceof Error ? error : String(error),
    requestId,
    timestamp: new Date().toISOString(),
  });

  // Return generic error message to client (security)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred. Please try again later.',
      code: 'UNEXPECTED_ERROR',
      status: 500,
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Generates unique request ID for tracking
 *
 * Format: req_<timestamp>_<random>
 * Example: req_1704067200000_x7k3m9p2q
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order function that wraps API route handlers with error handling
 *
 * Automatically catches and formats errors, adds request IDs, and logs requests.
 *
 * @example
 * export const POST = withErrorHandler(async (request: Request) => {
 *   const body = await request.json();
 *   const result = await useCase.execute(body);
 *   return successResponse(result);
 * });
 */
export function withErrorHandler<T = unknown>(
  handler: (request: Request, context?: T) => Promise<Response>
) {
  return async (request: Request, context?: T): Promise<Response> => {
    const requestId = generateRequestId();

    try {
      // Log incoming request
      logRequest(request.method, request.url, requestId);

      return await handler(request, context);
    } catch (error: unknown) {
      return createErrorResponse(error, requestId);
    }
  };
}

/**
 * Logs incoming API requests with metadata
 *
 * Includes request ID, method, URL, and timestamp for audit trail.
 */
export function logRequest(
  method: string,
  url: string,
  requestId: string,
  userId?: number
): void {
  console.log(`[${requestId}] ${method} ${url}`, {
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Type guard utilities for error handling
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return 'UNKNOWN_ERROR';
}

export function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}
