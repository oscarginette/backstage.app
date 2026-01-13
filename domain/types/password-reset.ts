/**
 * Password Reset Constants
 * Use these constants instead of string literals for type safety
 */

/**
 * Token expiration time in milliseconds
 * SECURITY: 1 hour is standard practice (balance between security and UX)
 */
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Token expiration time in hours (for email templates)
 */
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Token length in characters (64 chars = 32 bytes hex-encoded)
 * SECURITY: Matches crypto.randomBytes(32).toString('hex')
 */
export const PASSWORD_RESET_TOKEN_LENGTH = 64;

/**
 * Password Reset Sources for audit trail
 */
export const PASSWORD_RESET_SOURCES = {
  FORGOT_PASSWORD_FORM: 'forgot_password_form' as const,
  ADMIN_ACTION: 'admin_action' as const,
} as const;

export type PasswordResetSource =
  typeof PASSWORD_RESET_SOURCES[keyof typeof PASSWORD_RESET_SOURCES];

/**
 * Password Reset Events for consent history (GDPR compliance)
 */
export const PASSWORD_RESET_EVENTS = {
  TOKEN_REQUESTED: 'password_reset_requested' as const,
  PASSWORD_CHANGED: 'password_changed' as const,
  TOKEN_EXPIRED: 'token_expired' as const,
  INVALID_TOKEN_ATTEMPT: 'invalid_token_attempt' as const,
} as const;

export type PasswordResetEvent =
  typeof PASSWORD_RESET_EVENTS[keyof typeof PASSWORD_RESET_EVENTS];
