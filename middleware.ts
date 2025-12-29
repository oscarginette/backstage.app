/**
 * Next.js Middleware - Rate Limiting
 *
 * Runs on Vercel Edge Network before API routes.
 * Provides DDoS, brute force, and abuse protection across all API endpoints.
 *
 * How Next.js Middleware Works:
 * 1. Runs on EVERY request matching the matcher config
 * 2. Executes BEFORE page/API route handlers
 * 3. Runs on Vercel Edge (low latency, globally distributed)
 * 4. Can modify request/response headers
 * 5. Can block requests (return Response directly)
 *
 * Clean Architecture:
 * - Infrastructure layer (not business logic)
 * - Delegates to lib/rate-limit.ts for actual rate limiting logic
 * - API routes remain clean and focused on business logic
 *
 * Matcher Configuration:
 * - Applies ONLY to /api/* routes (not pages, static files, images)
 * - Excludes _next/static, _next/image, favicon.ico (performance)
 *
 * Learn more:
 * - Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
 * - Vercel Edge: https://vercel.com/docs/concepts/functions/edge-middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitResponse,
} from '@/lib/rate-limit';

/**
 * Middleware function - Runs on every API request
 *
 * Flow:
 * 1. Extract user ID from request (if authenticated)
 * 2. Check rate limit based on endpoint type and identifier
 * 3. If limit exceeded: Return 429 with Retry-After header
 * 4. If limit OK: Add rate limit headers and continue
 *
 * Performance:
 * - Runs on Vercel Edge (< 50ms latency globally)
 * - Redis query via Upstash REST API (< 10ms)
 * - Total overhead: < 60ms per request
 */
export async function middleware(request: NextRequest) {
  // Extract user ID from session/token if needed
  // TODO: Integrate with NextAuth to get authenticated user ID
  // For now, we use IP-based rate limiting for all requests
  const userId = undefined; // await getAuthenticatedUserId(request);

  // Check rate limit
  const result = await checkRateLimit(request, userId);

  // If rate limit exceeded, return 429 response
  if (!result.success) {
    return createRateLimitResponse(result);
  }

  // Rate limit OK, add headers to response and continue
  const response = NextResponse.next();

  // Add rate limit headers to response
  const headers = createRateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Matcher configuration
 *
 * Specifies which routes this middleware applies to.
 *
 * Pattern breakdown:
 * - /api/:path* -> All API routes and subroutes
 *
 * Excluded (via negative lookahead in matcher):
 * - /_next/static/* -> Next.js static files (handled by CDN)
 * - /_next/image/* -> Next.js image optimization (handled by CDN)
 * - /favicon.ico -> Browser favicon requests
 *
 * Why exclude these?
 * - Performance: Static assets should be served from CDN
 * - No need: Static files don't need rate limiting
 * - Avoid overhead: Middleware adds latency (even if small)
 *
 * Alternative matchers (examples):
 * ```typescript
 * // All routes except static files
 * export const config = {
 *   matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
 * };
 *
 * // Specific API routes only
 * export const config = {
 *   matcher: ['/api/auth/:path*', '/api/emails/:path*'],
 * };
 *
 * // Multiple patterns
 * export const config = {
 *   matcher: ['/api/:path*', '/admin/:path*'],
 * };
 * ```
 */
export const config = {
  matcher: [
    /*
     * Match all API routes:
     * - /api/auth/signup
     * - /api/emails/send
     * - /api/webhooks/resend
     * - etc.
     */
    '/api/:path*',
  ],
};

/**
 * OPTIONAL: Helper to extract authenticated user ID
 *
 * If you want user-specific rate limiting (recommended for email sending):
 *
 * ```typescript
 * import { getToken } from 'next-auth/jwt';
 *
 * async function getAuthenticatedUserId(request: NextRequest): Promise<string | undefined> {
 *   try {
 *     const token = await getToken({
 *       req: request,
 *       secret: process.env.NEXTAUTH_SECRET,
 *     });
 *
 *     return token?.sub; // User ID from JWT
 *   } catch {
 *     return undefined;
 *   }
 * }
 * ```
 *
 * Then update middleware:
 * ```typescript
 * const userId = await getAuthenticatedUserId(request);
 * const result = await checkRateLimit(request, userId);
 * ```
 *
 * Benefits:
 * - Prevents multi-IP abuse (user can't bypass limit by changing IP)
 * - More accurate limits for authenticated actions (email sending)
 * - Better UX (users see their own limits, not shared IP limits)
 */
