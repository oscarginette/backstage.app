/**
 * UnauthorizedError
 *
 * Thrown when a user is not authenticated (not logged in).
 * Maps to HTTP 401 Unauthorized.
 *
 * Clean Architecture: Domain layer error with no external dependencies.
 */

export class UnauthorizedError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
