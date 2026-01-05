import { THEMES, Theme } from '@/domain/types/appearance';

export interface UserAppearanceProps {
  userId: number;
  theme: Theme;
  updatedAt: Date;
}

/**
 * UserAppearance Entity
 *
 * Represents user's appearance preferences (theme mode).
 * Immutable entity with validation.
 *
 * Business Rules:
 * - Theme must be one of: light, dark, system
 * - UserId must be positive integer
 * - Default theme is 'system' (respects OS preference)
 *
 * Clean Architecture:
 * - Pure domain logic (zero external dependencies)
 * - Immutable (updateTheme returns new instance)
 * - Self-validating (throws on invalid data)
 */
export class UserAppearance {
  private constructor(
    public readonly userId: number,
    public readonly theme: Theme,
    public readonly updatedAt: Date
  ) {}

  /**
   * Create UserAppearance from props
   * Validates all inputs
   */
  static create(props: UserAppearanceProps): UserAppearance {
    UserAppearance.validate(props);
    return new UserAppearance(props.userId, props.theme, props.updatedAt);
  }

  /**
   * Create default UserAppearance
   * Uses 'system' theme (respects OS preference)
   */
  static createDefault(userId: number): UserAppearance {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('UserId must be a positive integer');
    }
    return new UserAppearance(userId, THEMES.SYSTEM, new Date());
  }

  /**
   * Validate UserAppearance props
   * Throws on invalid data
   */
  private static validate(props: UserAppearanceProps): void {
    if (!Number.isInteger(props.userId) || props.userId <= 0) {
      throw new Error('UserId must be a positive integer');
    }

    const validThemes = Object.values(THEMES);
    if (!validThemes.includes(props.theme)) {
      throw new Error(
        `Invalid theme: ${props.theme}. Must be one of: ${validThemes.join(', ')}`
      );
    }

    if (!(props.updatedAt instanceof Date) || isNaN(props.updatedAt.getTime())) {
      throw new Error('UpdatedAt must be a valid Date');
    }
  }

  /**
   * Update theme preference
   * Returns new instance (immutability)
   */
  updateTheme(newTheme: Theme): UserAppearance {
    return UserAppearance.create({
      userId: this.userId,
      theme: newTheme,
      updatedAt: new Date(),
    });
  }

  /**
   * Check if theme is custom (not system default)
   */
  isCustomTheme(): boolean {
    return this.theme !== THEMES.SYSTEM;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      userId: this.userId,
      theme: this.theme,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
