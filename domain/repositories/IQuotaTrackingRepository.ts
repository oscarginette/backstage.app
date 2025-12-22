/**
 * IQuotaTrackingRepository Interface
 *
 * Repository contract for quota tracking operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 */

import { QuotaTracking } from '../entities/QuotaTracking';

export interface IQuotaTrackingRepository {
  /**
   * Get quota tracking by user ID
   * @param userId - User identifier
   * @returns QuotaTracking entity or null if not found
   */
  getByUserId(userId: number): Promise<QuotaTracking | null>;

  /**
   * Increment email count for user
   * @param userId - User identifier
   * @throws Error if quota not found or update fails
   */
  incrementEmailCount(userId: number): Promise<void>;

  /**
   * Reset daily email count to 0
   * @param userId - User identifier
   * @throws Error if quota not found or reset fails
   */
  resetDailyCount(userId: number): Promise<void>;

  /**
   * Update monthly limit for user
   * @param userId - User identifier
   * @param newLimit - New monthly limit (1-10000)
   * @throws Error if validation fails or update fails
   */
  updateMonthlyLimit(userId: number, newLimit: number): Promise<void>;

  /**
   * Create new quota tracking record
   * @param userId - User identifier
   * @param monthlyLimit - Initial monthly limit
   * @returns Created QuotaTracking entity
   */
  create(userId: number, monthlyLimit: number): Promise<QuotaTracking>;
}
