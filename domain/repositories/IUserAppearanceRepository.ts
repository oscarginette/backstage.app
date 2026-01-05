import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme } from '@/domain/types/appearance';

/**
 * IUserAppearanceRepository
 *
 * Persistence interface for user appearance preferences.
 * Follows Interface Segregation Principle (ISP) - minimal interface.
 * Enables Dependency Inversion Principle (DIP) - domain depends on interface.
 *
 * Implementations:
 * - PostgresUserAppearanceRepository (production database)
 * - MockUserAppearanceRepository (testing)
 *
 * Clean Architecture:
 * - Defined in domain layer (zero dependencies)
 * - Implemented in infrastructure layer
 * - Use cases depend on this interface, not concrete implementations
 */
export interface IUserAppearanceRepository {
  /**
   * Get user's appearance preferences
   *
   * @param userId - User ID
   * @returns UserAppearance entity (defaults to system theme if not found)
   */
  getByUserId(userId: number): Promise<UserAppearance>;

  /**
   * Update user's theme preference
   *
   * Creates record if not exists (upsert behavior).
   *
   * @param userId - User ID
   * @param theme - New theme preference
   * @returns Updated UserAppearance entity
   * @throws Error if user doesn't exist
   */
  updateTheme(userId: number, theme: Theme): Promise<UserAppearance>;

  /**
   * Check if user has custom appearance settings
   *
   * @param userId - User ID
   * @returns true if user has non-default theme
   */
  exists(userId: number): Promise<boolean>;
}
