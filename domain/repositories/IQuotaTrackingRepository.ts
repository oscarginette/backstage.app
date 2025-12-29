/**
 * IQuotaTrackingRepository Interface
 *
 * Repository contract for quota tracking operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 *
 * Transaction Support:
 * - Methods with "WithLock" suffix use FOR UPDATE to prevent race conditions
 * - Use these in transactions to ensure quota accuracy (critical for billing)
 */

import { QuotaTracking } from '../entities/QuotaTracking';
import { TransactionClient } from '@/lib/db-transaction-helper';

export interface IQuotaTrackingRepository {
  /**
   * Get quota tracking by user ID
   * @param userId - User identifier
   * @returns QuotaTracking entity or null if not found
   */
  getByUserId(userId: number): Promise<QuotaTracking | null>;

  /**
   * Get quota tracking by user ID with row-level lock (FOR UPDATE)
   * IMPORTANT: Must be called within a transaction
   * Prevents concurrent modifications to quota (prevents oversending)
   *
   * Usage Example:
   * ```typescript
   * await withTransaction(async (tx) => {
   *   const quota = await quotaRepo.getByUserIdWithLock(userId, tx);
   *   // quota is now locked until transaction completes
   *   if (quota.canSendEmail()) {
   *     await quotaRepo.incrementEmailCountInTransaction(userId, tx);
   *   }
   * });
   * ```
   *
   * @param userId - User identifier
   * @param tx - Transaction client
   * @returns QuotaTracking entity or null if not found
   * @throws Error if not called within a transaction
   */
  getByUserIdWithLock(userId: number, tx: TransactionClient): Promise<QuotaTracking | null>;

  /**
   * Increment email count for user
   * WARNING: Not transaction-safe, use incrementEmailCountInTransaction instead
   * @param userId - User identifier
   * @throws Error if quota not found or update fails
   * @deprecated Use incrementEmailCountInTransaction with withTransaction
   */
  incrementEmailCount(userId: number): Promise<void>;

  /**
   * Increment email count within a transaction
   * IMPORTANT: Must be called within a transaction after getByUserIdWithLock
   *
   * @param userId - User identifier
   * @param tx - Transaction client
   * @throws Error if quota not found or update fails
   */
  incrementEmailCountInTransaction(userId: number, tx: TransactionClient): Promise<void>;

  /**
   * Reset daily email count to 0
   * @param userId - User identifier
   * @throws Error if quota not found or reset fails
   */
  resetDailyCount(userId: number): Promise<void>;

  /**
   * Reset daily email count within a transaction
   * @param userId - User identifier
   * @param tx - Transaction client
   * @throws Error if quota not found or reset fails
   */
  resetDailyCountInTransaction(userId: number, tx: TransactionClient): Promise<void>;

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
