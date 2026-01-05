import { sql } from '@vercel/postgres';
import { IUserAppearanceRepository } from '@/domain/repositories/IUserAppearanceRepository';
import { UserAppearance } from '@/domain/entities/UserAppearance';
import { Theme, THEMES } from '@/domain/types/appearance';

interface UserAppearanceRow {
  id: number;
  theme: Theme;
  theme_updated_at: Date;
}

/**
 * PostgresUserAppearanceRepository
 *
 * PostgreSQL implementation of appearance persistence.
 * Implements Dependency Inversion Principle (DIP):
 * - Domain layer depends on IUserAppearanceRepository interface
 * - This implementation is injected at runtime
 *
 * Clean Architecture:
 * - Infrastructure layer (external dependency)
 * - Uses Vercel Postgres with parameterized queries (SQL injection safe)
 * - Returns domain entities (UserAppearance)
 *
 * USAGE:
 * ```typescript
 * const repository = new PostgresUserAppearanceRepository();
 * const appearance = await repository.getByUserId(123);
 * ```
 */
export class PostgresUserAppearanceRepository
  implements IUserAppearanceRepository
{
  /**
   * Get user's appearance preferences
   *
   * @param userId - User ID
   * @returns UserAppearance entity (defaults to system theme if user not found)
   */
  async getByUserId(userId: number): Promise<UserAppearance> {
    const result = await sql<UserAppearanceRow>`
      SELECT id, theme, theme_updated_at
      FROM users
      WHERE id = ${userId}
    `;

    if (result.rows.length === 0) {
      // User not found: return default appearance
      return UserAppearance.createDefault(userId);
    }

    const row = result.rows[0];
    return UserAppearance.create({
      userId: row.id,
      theme: row.theme,
      updatedAt: row.theme_updated_at,
    });
  }

  /**
   * Update user's theme preference
   *
   * Creates record if not exists (upsert behavior via UPDATE).
   *
   * @param userId - User ID
   * @param theme - New theme preference
   * @returns Updated UserAppearance entity
   * @throws Error if user doesn't exist
   */
  async updateTheme(userId: number, theme: Theme): Promise<UserAppearance> {
    const now = new Date();

    const result = await sql<UserAppearanceRow>`
      UPDATE users
      SET
        theme = ${theme},
        theme_updated_at = ${now.toISOString()}
      WHERE id = ${userId}
      RETURNING id, theme, theme_updated_at
    `;

    if (result.rows.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    const row = result.rows[0];
    return UserAppearance.create({
      userId: row.id,
      theme: row.theme,
      updatedAt: row.theme_updated_at,
    });
  }

  /**
   * Check if user has custom appearance settings
   *
   * @param userId - User ID
   * @returns true if user has non-default (non-system) theme
   */
  async exists(userId: number): Promise<boolean> {
    const result = await sql`
      SELECT 1
      FROM users
      WHERE id = ${userId} AND theme != ${THEMES.SYSTEM}
    `;

    return result.rows.length > 0;
  }
}
