/**
 * List Color Constants
 *
 * Predefined color palette for contact lists.
 * Ensures visual consistency across the application.
 */

export const LIST_COLORS = {
  INDIGO: '#6366F1',
  ORANGE: '#FF5500',
  EMERALD: '#10B981',
  ROSE: '#F43F5E',
  AMBER: '#F59E0B',
  CYAN: '#06B6D4',
  PURPLE: '#A855F7',
  PINK: '#EC4899',
} as const;

export type ListColor = (typeof LIST_COLORS)[keyof typeof LIST_COLORS];

/**
 * Array of all available colors for easy iteration in UI
 */
export const LIST_COLOR_OPTIONS: ListColor[] = Object.values(LIST_COLORS);

/**
 * List limits and constraints
 */
export const LIST_LIMITS = {
  MAX_LISTS_PER_USER: 50,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;
