/**
 * Database connection wrapper
 * Supports both Vercel Postgres (Neon) and local PostgreSQL
 *
 * DEPRECATED: This module is kept for backward compatibility.
 * New code should import from '@/lib/db-config' instead.
 *
 * Migration path:
 * - Old: import { sql } from '@/lib/db';
 * - New: import { db } from '@/lib/db-config';
 *
 * The new db-config module provides:
 * - Connection pooling with configurable limits
 * - Query timeouts to prevent hanging queries
 * - Health check functionality
 * - Better error handling and monitoring
 */

import { db } from '@/lib/db-config';

/**
 * @deprecated Use `db` from '@/lib/db-config' instead
 * Kept for backward compatibility with existing code
 */
export const sql = db;

export default sql;
