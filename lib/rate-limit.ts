/**
 * Rate Limiting Configuration
 *
 * Infrastructure layer component for DDoS, brute force, and abuse protection.
 * Uses Upstash Redis (Vercel KV) for distributed rate limiting across serverless functions.
 *
 * Clean Architecture: This is an infrastructure concern, NOT business logic.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create Vercel KV (Redis) instance:
 *    - Go to Vercel Dashboard > Storage > Create Database > KV
 *    - Or: https://vercel.com/docs/storage/vercel-kv/quickstart
 *
 * 2. Copy environment variables to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=xxx
 *
 * 3. Install dependencies (if not already installed):
 *    npm install @upstash/ratelimit @upstash/redis
 *
 * TESTING:
 * Test rate limiting locally with curl:
 *
 * ```bash
 * # Test auth endpoint (5 req/15min):
 * for i in {1..6}; do
 *   curl -X POST http://localhost:3002/api/auth/signup \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"test@example.com"}' \
 *     -v 2>&1 | grep -E "HTTP|X-RateLimit"
 *   sleep 1
 * done
 *
 * # Test general endpoint (60 req/1min):
 * for i in {1..61}; do
 *   curl http://localhost:3002/api/contacts \
 *     -v 2>&1 | grep -E "HTTP|X-RateLimit"
 * done
 * ```
 *
 * Expected behavior:
 * - First N requests: 200 OK with X-RateLimit-Remaining decreasing
 * - After limit: 429 Too Many Requests with Retry-After header
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

// Rate limit configurations per endpoint type
export const RATE_LIMITS = {
  // Authentication endpoints: Strict limit to prevent brute force
  auth: {
    requests: 5,
    window: '15 m', // 15 minutes
    description: 'Authentication routes (signup, login, password reset)',
  },

  // Email sending: Prevent spam and abuse
  email: {
    requests: 10,
    window: '1 m', // 1 minute
    description: 'Email sending endpoints (per authenticated user)',
  },

  // Webhooks: Higher limit for legitimate webhook providers
  webhook: {
    requests: 100,
    window: '1 m', // 1 minute
    description: 'Webhook endpoints (Resend, Stripe, etc.)',
  },

  // Default: General API protection
  default: {
    requests: 60,
    window: '1 m', // 1 minute
    description: 'Default rate limit for all other API routes',
  },
} as const;

/**
 * Creates Redis client for Upstash
 *
 * Uses REST API (not TCP) for serverless compatibility.
 * Environment variables are auto-provided by Vercel KV.
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Graceful degradation: If Redis not configured, return null
  // Middleware will skip rate limiting (useful for local development without Redis)
  if (!url || !token) {
    console.warn(
      '⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set'
    );
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

// Singleton Redis client
const redis = createRedisClient();

/**
 * Creates rate limiter instances per endpoint type
 *
 * Uses sliding window algorithm for precise rate limiting.
 * Keys are automatically prefixed with "@upstash/ratelimit" namespace.
 */
function createRateLimiters() {
  if (!redis) {
    return null;
  }

  return {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.auth.requests,
        RATE_LIMITS.auth.window
      ),
      prefix: 'ratelimit:auth',
      analytics: true, // Enable Upstash analytics
    }),

    email: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.email.requests,
        RATE_LIMITS.email.window
      ),
      prefix: 'ratelimit:email',
      analytics: true,
    }),

    webhook: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.webhook.requests,
        RATE_LIMITS.webhook.window
      ),
      prefix: 'ratelimit:webhook',
      analytics: true,
    }),

    default: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.default.requests,
        RATE_LIMITS.default.window
      ),
      prefix: 'ratelimit:default',
      analytics: true,
    }),
  };
}

// Singleton rate limiter instances
const rateLimiters = createRateLimiters();

/**
 * Extracts client identifier from request
 *
 * Priority:
 * 1. Authenticated user ID (best for preventing multi-IP abuse)
 * 2. IP address from x-forwarded-for (Vercel provides this)
 * 3. IP address from x-real-ip (fallback)
 * 4. Default identifier (should never happen in production)
 *
 * Why user ID over IP?
 * - Prevents authenticated users from bypassing limits via VPN/proxies
 * - More accurate for user-specific limits (email sending)
 *
 * Why IP for unauthenticated?
 * - Standard practice for public endpoints
 * - Works with Vercel's edge network
 */
export function getClientIdentifier(
  request: NextRequest,
  userId?: string
): string {
  // Prefer authenticated user ID for user-specific limits
  if (userId) {
    return `user:${userId}`;
  }

  // Extract IP from Vercel's headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Determines rate limiter type based on request path
 *
 * Pattern matching for endpoint categorization:
 * - /api/auth/* -> auth limiter (strict)
 * - /api/emails/send -> email limiter (per user)
 * - /api/webhooks/* -> webhook limiter (permissive)
 * - Everything else -> default limiter
 */
export function getRateLimiterType(
  pathname: string
): keyof typeof RATE_LIMITS {
  if (pathname.startsWith('/api/auth/')) {
    return 'auth';
  }

  if (pathname === '/api/emails/send' || pathname === '/api/send-track') {
    return 'email';
  }

  if (pathname.startsWith('/api/webhooks/') || pathname.startsWith('/api/webhook/')) {
    return 'webhook';
  }

  return 'default';
}

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  pending?: Promise<unknown>; // Background analytics
}

/**
 * Checks rate limit for a request
 *
 * @param request - Next.js request object
 * @param userId - Optional authenticated user ID
 * @returns Rate limit result with success, limit, remaining, reset
 *
 * Usage in API routes:
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const { success, remaining, reset } = await checkRateLimit(request);
 *
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: 'Too many requests' },
 *       {
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Remaining': '0',
 *           'X-RateLimit-Reset': reset.toString(),
 *           'Retry-After': Math.ceil((reset * 1000 - Date.now()) / 1000).toString(),
 *         },
 *       }
 *     );
 *   }
 *
 *   // Process request...
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  // Graceful degradation: If rate limiters not configured, allow all requests
  if (!rateLimiters) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const pathname = request.nextUrl.pathname;
  const limiterType = getRateLimiterType(pathname);
  const identifier = getClientIdentifier(request, userId);

  const limiter = rateLimiters[limiterType];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}

/**
 * Creates rate limit headers for HTTP responses
 *
 * Standard headers (RFC 6585):
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until client can retry (only on 429)
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  includeRetryAfter = false
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (includeRetryAfter && !result.success) {
    // Calculate seconds until reset
    const retryAfterSeconds = Math.ceil((result.reset * 1000 - Date.now()) / 1000);
    headers['Retry-After'] = Math.max(0, retryAfterSeconds).toString();
  }

  return headers;
}

/**
 * Creates a 429 Too Many Requests response
 *
 * Includes:
 * - Standard rate limit headers
 * - Retry-After header (seconds)
 * - User-friendly error message
 */
export function createRateLimitResponse(
  result: RateLimitResult
): Response {
  const retryAfterSeconds = Math.ceil((result.reset * 1000 - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      limit: result.limit,
      reset: result.reset,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...createRateLimitHeaders(result, true),
      },
    }
  );
}
