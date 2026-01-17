/**
 * Download Gate Step Types
 *
 * Type-safe step identifiers and configuration.
 * ALWAYS use these instead of string literals.
 *
 * Clean Architecture: Domain types layer
 */

export const GATE_STEPS = {
  EMAIL: 'email' as const,
  SOUNDCLOUD: 'soundcloud' as const,
  INSTAGRAM: 'instagram' as const,
  SPOTIFY: 'spotify' as const,
  DOWNLOAD: 'download' as const,
} as const;

export type GateStep = typeof GATE_STEPS[keyof typeof GATE_STEPS];

export const OAUTH_STATUS = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  PENDING: 'pending' as const,
} as const;

export type OAuthStatus = typeof OAUTH_STATUS[keyof typeof OAUTH_STATUS];

export const OAUTH_PROVIDERS = {
  SOUNDCLOUD: 'soundcloud' as const,
  SPOTIFY: 'spotify' as const,
} as const;

export type OAuthProvider = typeof OAUTH_PROVIDERS[keyof typeof OAUTH_PROVIDERS];

/**
 * Timeout constants for UI feedback
 */
export const GATE_TIMEOUTS = {
  BUY_LINK_SUCCESS_MS: 8000,
  OAUTH_ERROR_MS: 5000,
} as const;

/**
 * LocalStorage key prefix for gate submissions
 */
export const GATE_STORAGE_PREFIX = 'gate_submission_' as const;
