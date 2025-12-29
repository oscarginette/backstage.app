/**
 * Database Transaction Helper
 *
 * Provides transaction management utilities for critical operations
 * that combine database operations with external services.
 *
 * Clean Architecture: Infrastructure layer utility
 * SOLID: Single Responsibility (only transaction management)
 *
 * Critical Use Cases:
 * - Email sending with quota tracking (prevent financial loss)
 * - Contact import with consent history (prevent orphan records)
 * - Any operation requiring atomicity across multiple tables
 *
 * Transaction Pattern:
 * 1. BEGIN transaction
 * 2. Lock rows with FOR UPDATE (prevent race conditions)
 * 3. Verify business rules (quota, limits, etc.)
 * 4. Perform database operations
 * 5. Call external services (email, webhooks, etc.)
 * 6. COMMIT if all succeeded, ROLLBACK on any error
 *
 * Row-Level Locking (FOR UPDATE):
 * - Prevents concurrent modifications (race conditions)
 * - Essential for quota tracking to prevent oversending
 * - Locks are released on COMMIT/ROLLBACK
 *
 * IMPORTANT: Vercel Postgres (Neon) uses connection pooling.
 * We must use the same connection for the entire transaction.
 */

import { sql } from '@/lib/db';
import { Pool, PoolClient } from 'pg';

/**
 * Transaction client interface
 * Provides type-safe query execution within a transaction
 */
export interface TransactionClient {
  /**
   * Execute a parameterized query within the transaction
   * @param text - SQL query with $1, $2, etc. placeholders
   * @param values - Parameter values
   */
  query<T = any>(text: string, values?: any[]): Promise<{
    rows: T[];
    rowCount: number | null;
  }>;

  /**
   * Template literal query (like sql`...`)
   * Note: This is a convenience wrapper around query()
   */
  sql<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<{
    rows: T[];
    rowCount: number | null;
  }>;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (client: TransactionClient) => Promise<T>;

/**
 * Transaction result with rollback flag
 */
export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  rolledBack: boolean;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /**
   * Isolation level for the transaction
   * Default: READ COMMITTED (sufficient for most use cases)
   * Use SERIALIZABLE for critical financial operations
   */
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

  /**
   * Maximum retry attempts on deadlock
   * Default: 3
   */
  maxRetries?: number;

  /**
   * Retry delay in milliseconds
   * Default: 100ms (with exponential backoff)
   */
  retryDelayMs?: number;
}

/**
 * Execute a callback within a database transaction
 *
 * Features:
 * - Automatic BEGIN/COMMIT/ROLLBACK
 * - Auto-retry on deadlock (40P01 error code)
 * - Row-level locking support (use SELECT ... FOR UPDATE in your queries)
 * - Isolation level configuration
 *
 * Usage Example:
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   // 1. Lock the quota row to prevent race conditions
 *   const quota = await tx.query(
 *     'SELECT * FROM quota_tracking WHERE user_id = $1 FOR UPDATE',
 *     [userId]
 *   );
 *
 *   // 2. Verify quota (inside transaction, locked)
 *   if (quota.rows[0].emails_sent_today >= quota.rows[0].monthly_limit) {
 *     throw new QuotaExceededError();
 *   }
 *
 *   // 3. Increment quota BEFORE sending email
 *   await tx.query(
 *     'UPDATE quota_tracking SET emails_sent_today = emails_sent_today + 1 WHERE user_id = $1',
 *     [userId]
 *   );
 *
 *   // 4. Send email (if this fails, rollback will restore quota)
 *   const emailResult = await emailProvider.send(...);
 *   if (!emailResult.success) {
 *     throw new EmailSendError(emailResult.error);
 *   }
 *
 *   return emailResult;
 * });
 * ```
 *
 * @param callback - Function to execute within transaction
 * @param options - Transaction options (isolation level, retries, etc.)
 * @returns Promise resolving to the callback result
 * @throws Error if transaction fails after all retries
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    isolationLevel = 'READ COMMITTED',
    maxRetries = 3,
    retryDelayMs = 100
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      // Get a dedicated client for the transaction
      const client = await getTransactionClient();

      try {
        // Start transaction with isolation level
        await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);

        // Create transaction wrapper
        const txClient: TransactionClient = {
          query: async (text: string, values?: any[]) => {
            return client.query(text, values || []);
          },
          sql: async (strings: TemplateStringsArray, ...values: any[]) => {
            // Convert template literal to parameterized query
            const text = strings.reduce((acc, str, i) => {
              return acc + str + (i < values.length ? `$${i + 1}` : '');
            }, '');
            return client.query(text, values);
          }
        };

        // Execute callback
        const result = await callback(txClient);

        // Commit transaction
        await client.query('COMMIT');

        // Release client back to pool
        await releaseTransactionClient(client);

        return result;
      } catch (error) {
        // Rollback on error
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }

        // Release client
        await releaseTransactionClient(client);

        // Check if it's a deadlock error (PostgreSQL error code 40P01)
        if (error instanceof Error && 'code' in error && error.code === '40P01') {
          // Deadlock detected, retry with exponential backoff
          attempt++;
          if (attempt < maxRetries) {
            const delay = retryDelayMs * Math.pow(2, attempt - 1);
            console.warn(`Deadlock detected, retrying transaction (attempt ${attempt}/${maxRetries}) after ${delay}ms`);
            await sleep(delay);
            continue;
          }
        }

        // Not a deadlock or max retries exceeded, throw error
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Transaction failed');
      if (attempt >= maxRetries - 1) {
        break;
      }
      attempt++;
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('Transaction failed after all retries');
}

/**
 * Get a transaction client
 * This handles both local PostgreSQL (pg Pool) and Vercel Postgres
 */
async function getTransactionClient(): Promise<any> {
  // Check if we're using local PostgreSQL with Pool
  const localPool = (sql as any).__pool;
  if (localPool && localPool instanceof Pool) {
    return localPool.connect();
  }

  // For Vercel Postgres, we need to access the underlying pool
  // @vercel/postgres exports a pool that we can use
  const { db } = await import('@vercel/postgres');
  const client = await db.connect();

  return client;
}

/**
 * Release a transaction client back to the pool
 */
async function releaseTransactionClient(client: any): Promise<void> {
  try {
    client.release();
  } catch (error) {
    console.error('Failed to release transaction client:', error);
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute multiple operations in a single transaction
 * with automatic rollback on any failure
 *
 * This is a convenience wrapper for common patterns where you need
 * to execute multiple database operations atomically.
 *
 * Usage Example:
 * ```typescript
 * await withTransactionMultiOps([
 *   (tx) => tx.query('UPDATE contacts SET subscribed = false WHERE id = $1', [contactId]),
 *   (tx) => tx.query('INSERT INTO consent_history (...) VALUES (...)', [...]),
 *   (tx) => emailProvider.send(...) // External service call
 * ]);
 * ```
 *
 * @param operations - Array of operations to execute
 * @param options - Transaction options
 * @returns Promise resolving to array of results
 */
export async function withTransactionMultiOps<T = any>(
  operations: Array<(tx: TransactionClient) => Promise<T>>,
  options?: TransactionOptions
): Promise<T[]> {
  return withTransaction(async (tx) => {
    const results: T[] = [];
    for (const operation of operations) {
      const result = await operation(tx);
      results.push(result);
    }
    return results;
  }, options);
}

/**
 * Check if an error is a transaction-related error
 * (deadlock, serialization failure, etc.)
 */
export function isTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const pgError = error as any;
  if (!pgError.code) return false;

  // PostgreSQL error codes:
  // 40P01 - deadlock_detected
  // 40001 - serialization_failure
  // 23505 - unique_violation (can occur in transactions)
  const transactionErrorCodes = ['40P01', '40001', '23505'];

  return transactionErrorCodes.includes(pgError.code);
}

/**
 * Lock a single row for update within a transaction
 * Prevents race conditions for critical resources (quotas, balances, etc.)
 *
 * Usage Example:
 * ```typescript
 * await withTransaction(async (tx) => {
 *   const quota = await lockRowForUpdate(tx, 'quota_tracking', { user_id: userId });
 *   // quota is now locked, no other transaction can modify it
 *   // until we COMMIT or ROLLBACK
 * });
 * ```
 *
 * @param tx - Transaction client
 * @param table - Table name
 * @param where - WHERE clause conditions
 * @returns Locked row(s)
 */
export async function lockRowForUpdate<T = any>(
  tx: TransactionClient,
  table: string,
  where: Record<string, any>
): Promise<T[]> {
  const whereKeys = Object.keys(where);
  const whereClause = whereKeys.map((key, idx) => `${key} = $${idx + 1}`).join(' AND ');
  const whereValues = whereKeys.map(key => where[key]);

  const query = `SELECT * FROM ${table} WHERE ${whereClause} FOR UPDATE`;
  const result = await tx.query<T>(query, whereValues);

  return result.rows;
}
