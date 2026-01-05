/**
 * Appearance Types and Constants
 *
 * Type-safe constants for theme management.
 * Follows pattern from subscriptions.ts and user-roles.ts
 *
 * USAGE:
 * - ALWAYS use THEMES.DARK instead of 'dark'
 * - ALWAYS use THEME_MODES.LIGHT instead of 'light'
 * - See .claude/CLAUDE.md for complete reference
 */

/**
 * Theme type definition
 *
 * Represents user's theme preference:
 * - light: Always use light theme
 * - dark: Always use dark theme
 * - system: Follow OS preference (default)
 */
export type Theme = 'light' | 'dark' | 'system';

export const THEMES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const,
} as const;

/**
 * Resolved theme mode (what actually renders)
 *
 * After resolving 'system' preference, only light/dark remain.
 */
export type ThemeMode = 'light' | 'dark';

export const THEME_MODES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
} as const;

/**
 * Storage configuration
 *
 * Cookie: For SSR consistency (prevents flicker)
 * LocalStorage: Client-side fallback
 */
export const THEME_STORAGE = {
  COOKIE_NAME: 'BACKSTAGE_THEME',
  COOKIE_EXPIRY_DAYS: 365,
  LOCAL_STORAGE_KEY: 'theme',
} as const;
