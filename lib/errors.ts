/**
 * Centralized Error Types
 *
 * All custom error classes for the application.
 * These errors carry semantic meaning and appropriate HTTP status codes.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

export class AccessDeniedError extends AppError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, 'ACCESS_DENIED', 403, details);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'QUOTA_EXCEEDED', 429, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', 409, details);
  }
}

export class EmailQuotaExceededError extends QuotaExceededError {
  constructor(message: string = 'Email quota exceeded', details?: unknown) {
    super(message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 'INTERNAL_ERROR', 500, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
