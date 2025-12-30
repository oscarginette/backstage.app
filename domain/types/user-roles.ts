/**
 * User Role Type Definitions
 *
 * Type definitions for user roles in the system.
 * Separated from User entity to allow safe imports in client components.
 *
 * Clean Architecture: Domain types with no external dependencies.
 */

export type UserRole = 'artist' | 'admin';

/**
 * User Role Constants
 * Use these constants instead of string literals for type safety
 */
export const USER_ROLES = {
  ARTIST: 'artist' as const,
  ADMIN: 'admin' as const,
} as const;
