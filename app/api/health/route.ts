/**
 * Health Check Endpoint
 *
 * Provides system health status for monitoring and load balancers.
 * Tests database connectivity and other critical services.
 *
 * Usage:
 * - GET /api/health - Check overall system health
 *
 * Response Codes:
 * - 200: All systems healthy
 * - 503: One or more systems degraded/unhealthy
 *
 * Response Format:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "checks": {
 *     "database": true | false,
 *     "pool": { "total": 10, "idle": 5, "waiting": 0 } | null
 *   },
 *   "error": "Optional error message if unhealthy"
 * }
 *
 * Architecture: Presentation layer (API route)
 * Clean Architecture: Only orchestrates health checks, no business logic
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getPoolStats } from '@/lib/db-config';

/**
 * Health check response type
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: boolean;
    pool?: {
      total: number;
      idle: number;
      waiting: number;
    } | null;
  };
  duration?: number;
  error?: string;
}

/**
 * GET /api/health
 *
 * Performs health checks on critical system components
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();

  const checks = {
    database: false,
    pool: null as ReturnType<typeof getPoolStats>,
  };

  try {
    // Check database connectivity
    try {
      checks.database = await checkDatabaseHealth();
    } catch (error) {
      console.error('[Health Check] Database check failed:', error);
      checks.database = false;
    }

    // Get pool statistics (if available)
    try {
      checks.pool = getPoolStats();
    } catch (error) {
      console.error('[Health Check] Pool stats failed:', error);
      checks.pool = null;
    }

    const duration = Date.now() - startTime;

    // Determine overall health status
    const allHealthy = checks.database;

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      duration,
      checks,
    };

    // Return 503 if any critical service is down
    const statusCode = allHealthy ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    // Unexpected error during health check
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[Health Check] Unexpected error:', error);

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      duration,
      checks,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 503 });
  }
}

/**
 * HEAD /api/health
 *
 * Lightweight health check for load balancers
 * Returns only status code, no body
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    const isHealthy = await checkDatabaseHealth();
    const statusCode = isHealthy ? 200 : 503;
    return new NextResponse(null, { status: statusCode });
  } catch (error) {
    console.error('[Health Check] HEAD request failed:', error);
    return new NextResponse(null, { status: 503 });
  }
}
