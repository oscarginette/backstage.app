/**
 * Database Connection Monitoring
 *
 * Optional monitoring utilities for tracking database connection usage
 * and detecting potential connection leaks during development.
 *
 * Features:
 * - Track active connections per operation
 * - Detect connection leaks (operations that don't release connections)
 * - Monitor connection pool statistics
 * - Log slow queries
 *
 * Usage:
 * - Development only - disabled in production for performance
 * - Wrap database operations with trackConnection()
 * - Monitor slow queries with trackQuery()
 *
 * Architecture: Infrastructure layer - Development tooling
 */

/**
 * Connection tracking state
 */
interface ConnectionTracker {
  operation: string;
  startTime: number;
  released: boolean;
}

const activeConnections = new Map<string, ConnectionTracker>();
let connectionIdCounter = 0;

/**
 * Track a database connection
 * Returns a release function to mark the connection as released
 *
 * @param operation - Description of the operation using the connection
 * @returns Release function to call when done with the connection
 *
 * @example
 * async function findUser(id: number) {
 *   const release = trackConnection('findUser');
 *   try {
 *     const result = await db`SELECT * FROM users WHERE id = ${id}`;
 *     return result.rows[0];
 *   } finally {
 *     release();
 *   }
 * }
 */
export function trackConnection(operation: string): () => void {
  // Only track in development
  if (process.env.NODE_ENV !== 'development') {
    return () => {}; // No-op in production
  }

  const id = `conn_${++connectionIdCounter}`;
  const tracker: ConnectionTracker = {
    operation,
    startTime: Date.now(),
    released: false,
  };

  activeConnections.set(id, tracker);

  console.log(`[DB Monitor] 🟢 Connection acquired: ${operation} (${id})`);
  console.log(`[DB Monitor] Active connections: ${activeConnections.size}`);

  // Return release function
  return () => {
    const tracker = activeConnections.get(id);
    if (!tracker) {
      console.warn(`[DB Monitor] ⚠️  Attempt to release unknown connection: ${id}`);
      return;
    }

    if (tracker.released) {
      console.warn(
        `[DB Monitor] ⚠️  Double release detected: ${operation} (${id})`
      );
      return;
    }

    const duration = Date.now() - tracker.startTime;
    tracker.released = true;
    activeConnections.delete(id);

    console.log(
      `[DB Monitor] 🔴 Connection released: ${operation} (${id}) - ${duration}ms`
    );
    console.log(`[DB Monitor] Active connections: ${activeConnections.size}`);

    // Warn about long-held connections
    if (duration > 5000) {
      console.warn(
        `[DB Monitor] ⚠️  Long-held connection: ${operation} held for ${duration}ms`
      );
    }
  };
}

/**
 * Track a database query execution time
 * Logs slow queries that exceed the threshold
 *
 * @param operation - Description of the query
 * @param queryFn - Function that executes the query
 * @param slowThresholdMs - Threshold in milliseconds to consider a query slow (default: 1000ms)
 * @returns Query result
 *
 * @example
 * const users = await trackQuery(
 *   'Get all active users',
 *   () => db`SELECT * FROM users WHERE active = true`
 * );
 */
export async function trackQuery<T>(
  operation: string,
  queryFn: () => Promise<T>,
  slowThresholdMs: number = 1000
): Promise<T> {
  // Only track in development
  if (process.env.NODE_ENV !== 'development') {
    return queryFn();
  }

  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration > slowThresholdMs) {
      console.warn(
        `[DB Monitor] 🐌 Slow query detected: ${operation} took ${duration}ms`
      );
    } else {
      console.log(`[DB Monitor] ⚡ Query completed: ${operation} (${duration}ms)`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[DB Monitor] ❌ Query failed: ${operation} after ${duration}ms`,
      error
    );
    throw error;
  }
}

/**
 * Get current connection statistics
 * Useful for debugging and monitoring
 */
export function getConnectionStats(): {
  activeCount: number;
  operations: Array<{ operation: string; duration: number }>;
} {
  const now = Date.now();

  return {
    activeCount: activeConnections.size,
    operations: Array.from(activeConnections.values()).map((tracker) => ({
      operation: tracker.operation,
      duration: now - tracker.startTime,
    })),
  };
}

/**
 * Detect potential connection leaks
 * Logs warnings for connections held longer than the threshold
 *
 * @param thresholdMs - Threshold in milliseconds (default: 10000ms = 10 seconds)
 */
export function detectLeaks(thresholdMs: number = 10000): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const now = Date.now();
  const leaks: Array<{ operation: string; duration: number }> = [];

  activeConnections.forEach((tracker, id) => {
    const duration = now - tracker.startTime;
    if (duration > thresholdMs) {
      leaks.push({ operation: tracker.operation, duration });
    }
  });

  if (leaks.length > 0) {
    console.warn(
      `[DB Monitor] 🚨 Potential connection leaks detected (${leaks.length}):`
    );
    leaks.forEach((leak) => {
      console.warn(
        `  - ${leak.operation}: held for ${leak.duration}ms (threshold: ${thresholdMs}ms)`
      );
    });
  }
}

/**
 * Start periodic leak detection
 * Checks for connection leaks every interval
 *
 * @param intervalMs - Check interval in milliseconds (default: 30000ms = 30 seconds)
 * @param thresholdMs - Leak threshold in milliseconds (default: 10000ms = 10 seconds)
 * @returns Function to stop the periodic checks
 */
export function startLeakDetection(
  intervalMs: number = 30000,
  thresholdMs: number = 10000
): () => void {
  if (process.env.NODE_ENV !== 'development') {
    return () => {}; // No-op in production
  }

  console.log(
    `[DB Monitor] 🔍 Starting leak detection (interval: ${intervalMs}ms, threshold: ${thresholdMs}ms)`
  );

  const interval = setInterval(() => {
    detectLeaks(thresholdMs);
  }, intervalMs);

  // Return stop function
  return () => {
    clearInterval(interval);
    console.log('[DB Monitor] 🛑 Leak detection stopped');
  };
}

/**
 * Wrapper for repository methods to automatically track connections
 *
 * @example
 * class PostgresUserRepository {
 *   async findById(id: number) {
 *     return withConnectionTracking('UserRepository.findById', async () => {
 *       const result = await db`SELECT * FROM users WHERE id = ${id}`;
 *       return result.rows[0];
 *     });
 *   }
 * }
 */
export async function withConnectionTracking<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const release = trackConnection(operation);
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Combined tracking: connection + query timing
 * Convenience wrapper for tracking both connection usage and query performance
 *
 * @example
 * async function getActiveUsers() {
 *   return withMonitoring('Get active users', async () => {
 *     return db`SELECT * FROM users WHERE active = true`;
 *   });
 * }
 */
export async function withMonitoring<T>(
  operation: string,
  queryFn: () => Promise<T>,
  slowThresholdMs: number = 1000
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return queryFn();
  }

  const release = trackConnection(operation);
  try {
    return await trackQuery(operation, queryFn, slowThresholdMs);
  } finally {
    release();
  }
}

/**
 * Print connection statistics summary
 * Useful for debugging
 */
export function printStats(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const stats = getConnectionStats();

  console.log('\n[DB Monitor] 📊 Connection Statistics:');
  console.log(`  Active connections: ${stats.activeCount}`);

  if (stats.operations.length > 0) {
    console.log('\n  Active operations:');
    stats.operations.forEach((op) => {
      console.log(`    - ${op.operation}: ${op.duration}ms`);
    });
  } else {
    console.log('  No active operations');
  }

  console.log('');
}

// Auto-start leak detection in development
// Disabled by default - uncomment to enable
// if (process.env.NODE_ENV === 'development') {
//   startLeakDetection();
// }
