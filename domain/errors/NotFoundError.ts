/**
 * NotFoundError
 *
 * Thrown when a requested resource cannot be found.
 * Maps to HTTP 404 status code.
 */

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
