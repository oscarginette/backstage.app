/**
 * ValidationError
 *
 * Thrown when input validation fails (invalid data format, missing fields, etc.).
 * Maps to HTTP 400 Bad Request.
 *
 * Clean Architecture: Domain layer error with no external dependencies.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
