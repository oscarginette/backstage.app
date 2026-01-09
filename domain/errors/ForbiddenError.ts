/**
 * ForbiddenError
 *
 * Thrown when a user is authenticated but lacks required permissions.
 * Maps to HTTP 403 Forbidden.
 *
 * Clean Architecture: Domain layer error with no external dependencies.
 */

export class ForbiddenError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
