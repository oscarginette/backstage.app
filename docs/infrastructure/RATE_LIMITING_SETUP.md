# Rate Limiting Setup Guide

This guide explains how to set up, configure, and test the rate limiting middleware for the Backstage application.

## Overview

The rate limiting implementation protects the application against:
- **DDoS attacks**: Distributed denial of service
- **Brute force**: Authentication attacks
- **API abuse**: Excessive requests from single sources

## Architecture

```
Request → Middleware (middleware.ts)
            ↓
         Rate Limit Check (lib/rate-limit.ts)
            ↓
         Upstash Redis (Vercel KV)
            ↓
         Success → Continue to API Route
         Blocked → Return 429 Too Many Requests
```

**Clean Architecture Compliance:**
- `lib/rate-limit.ts`: Infrastructure layer (configuration and logic)
- `middleware.ts`: Infrastructure layer (Next.js integration)
- API routes: Remain clean and focused on business logic

## Rate Limit Configuration

| Endpoint Type | Limit | Window | Description |
|--------------|-------|--------|-------------|
| `/api/auth/*` | 5 requests | 15 minutes | Authentication routes (signup, login) |
| `/api/emails/send` | 10 requests | 1 minute | Email sending per user |
| `/api/webhooks/*` | 100 requests | 1 minute | Webhook endpoints (Resend, Stripe) |
| Default | 60 requests | 1 minute | All other API routes |

## Setup Instructions

### 1. Create Vercel KV Database

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database**
3. Select **KV** (Redis)
4. Choose a name (e.g., `backstage-rate-limit`)
5. Select region (choose closest to your primary users)
6. Click **Create**

**Option B: Via Vercel CLI**
```bash
vercel env pull .env.local
```

This will automatically add the Upstash Redis credentials to your `.env.local`.

### 2. Copy Environment Variables

After creating the KV database, copy the credentials:

**From Vercel Dashboard:**
- Go to **Storage** → **Your KV Database** → **Settings**
- Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Add to `.env.local`:**
```bash
# Rate Limiting - Upstash Redis (Vercel KV)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 3. Verify Installation

Check that the required packages are installed:
```bash
npm list @upstash/ratelimit @upstash/redis
```

You should see:
```
backstage@0.1.0 /path/to/backstage.app
├── @upstash/ratelimit@2.0.x
└── @upstash/redis@1.34.x
```

### 4. Test Locally

Start the development server:
```bash
npm run dev
```

The application should start without errors. If you see:
```
⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set
```

This means rate limiting is gracefully degraded (disabled). Add the environment variables to enable it.

## Testing Rate Limiting

### Prerequisites
- Development server running (`npm run dev`)
- Upstash Redis configured
- `curl` or similar HTTP client

### Test 1: Default Rate Limit (60 req/min)

Test the default rate limit on a general API endpoint:

```bash
# Test script: Send 61 requests to /api/contacts
for i in {1..61}; do
  echo "Request $i:"
  curl -s http://localhost:3002/api/contacts \
    -H "Cookie: your_session_cookie_here" \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
  sleep 0.1
done
```

**Expected Results:**
- Requests 1-60: `HTTP/1.1 200 OK`
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 59, 58, 57...0`
  - `X-RateLimit-Reset: <unix_timestamp>`

- Request 61: `HTTP/1.1 429 Too Many Requests`
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 0`
  - `Retry-After: <seconds>`

**Response Body (429):**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "limit": 60,
  "reset": 1735488000
}
```

### Test 2: Authentication Rate Limit (5 req/15min)

Test the strict authentication rate limit:

```bash
# Test script: Send 6 requests to /api/auth/signup
for i in {1..6}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3002/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\"}" \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
  sleep 1
done
```

**Expected Results:**
- Requests 1-5: `HTTP/1.1 200 OK` (or 400 if validation fails)
  - `X-RateLimit-Limit: 5`
  - `X-RateLimit-Remaining: 4, 3, 2, 1, 0`

- Request 6: `HTTP/1.1 429 Too Many Requests`
  - `Retry-After: <seconds_until_reset>`

**Note:** After being rate limited, you must wait 15 minutes or change your IP to test again.

### Test 3: Webhook Rate Limit (100 req/min)

Test the permissive webhook rate limit:

```bash
# Test script: Send 101 requests to /api/webhooks/resend
for i in {1..101}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3002/api/webhooks/resend \
    -H "Content-Type: application/json" \
    -d '{"type":"email.sent","data":{}}' \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
done
```

**Expected Results:**
- Requests 1-100: Pass rate limit check
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 99, 98...0`

- Request 101: `HTTP/1.1 429 Too Many Requests`

### Test 4: Rate Limit Headers

Check that rate limit headers are present on all API responses:

```bash
curl -v http://localhost:3002/api/contacts 2>&1 | grep X-RateLimit
```

**Expected Output:**
```
< X-RateLimit-Limit: 60
< X-RateLimit-Remaining: 59
< X-RateLimit-Reset: 1735488000
```

### Test 5: Different IPs

Test that rate limits are per-IP:

```bash
# Request from normal IP
curl http://localhost:3002/api/contacts

# Request from different IP (via proxy or VPN)
curl --proxy http://proxy-server:8080 http://localhost:3002/api/contacts
```

Each IP should have its own independent rate limit counter.

## Advanced Configuration

### Customizing Rate Limits

Edit `/Users/user/Code/backstage.app/lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  auth: {
    requests: 10,        // Change from 5 to 10
    window: '30 m',      // Change from 15m to 30m
    description: 'Authentication routes',
  },
  // ... other limits
};
```

**Window format:**
- `'10 s'` = 10 seconds
- `'1 m'` = 1 minute
- `'15 m'` = 15 minutes
- `'1 h'` = 1 hour
- `'1 d'` = 1 day

### User-Specific Rate Limiting

To enable rate limiting per authenticated user (instead of per IP):

1. **Edit `middleware.ts`:**

```typescript
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Extract user ID from session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userId = token?.sub; // User ID from JWT

  // Check rate limit with user ID
  const result = await checkRateLimit(request, userId);

  // ... rest of middleware
}
```

2. **Benefits:**
- Prevents multi-IP abuse (users can't bypass limits via VPN)
- More accurate for per-user actions (email sending)
- Better UX (users see their own limits)

**Trade-offs:**
- Requires authentication check on every request (slight latency increase)
- Unauthenticated endpoints still use IP-based limiting

### Adding New Rate Limit Types

To add a new rate limit type (e.g., for file uploads):

1. **Add to `lib/rate-limit.ts`:**

```typescript
export const RATE_LIMITS = {
  // ... existing limits
  upload: {
    requests: 20,
    window: '1 h',
    description: 'File upload endpoints',
  },
};
```

2. **Update `getRateLimiterType()` function:**

```typescript
export function getRateLimiterType(pathname: string): keyof typeof RATE_LIMITS {
  // ... existing conditions

  if (pathname.startsWith('/api/upload/')) {
    return 'upload';
  }

  return 'default';
}
```

3. **Create rate limiter instance:**

```typescript
function createRateLimiters() {
  return {
    // ... existing limiters
    upload: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.upload.requests,
        RATE_LIMITS.upload.window
      ),
      prefix: 'ratelimit:upload',
      analytics: true,
    }),
  };
}
```

## Monitoring & Analytics

### Upstash Console

View rate limiting analytics:
1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database
3. Navigate to **Analytics**

**Metrics available:**
- Total requests
- Blocked requests (rate limited)
- Peak traffic times
- Per-endpoint statistics

### Vercel Analytics (Production)

When deployed on Vercel:
1. Go to **Vercel Dashboard** → **Your Project** → **Analytics**
2. Filter by status code `429` to see rate-limited requests
3. Check **Edge Middleware** logs for rate limit events

### Custom Logging

Add logging to track rate limit events:

**Edit `middleware.ts`:**
```typescript
export async function middleware(request: NextRequest) {
  const result = await checkRateLimit(request, userId);

  if (!result.success) {
    // Log rate limit event
    console.warn('Rate limit exceeded:', {
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for'),
      userId,
      limit: result.limit,
      reset: new Date(result.reset * 1000).toISOString(),
    });

    return createRateLimitResponse(result);
  }

  // ... continue
}
```

## Troubleshooting

### Issue: Rate limiting not working

**Symptoms:**
- No `X-RateLimit-*` headers in responses
- All requests succeed even after limit exceeded
- Console shows warning: "Rate limiting disabled"

**Solutions:**
1. Check environment variables are set:
   ```bash
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. Restart development server:
   ```bash
   npm run dev
   ```

3. Verify Upstash Redis is accessible:
   ```bash
   curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
        "$UPSTASH_REDIS_REST_URL/get/test"
   ```

### Issue: 429 errors in development

**Symptoms:**
- Frequent 429 errors during development
- Unable to reload page multiple times

**Solutions:**
1. **Increase limits for development:**
   ```typescript
   // lib/rate-limit.ts
   const isDev = process.env.NODE_ENV === 'development';

   export const RATE_LIMITS = {
     default: {
       requests: isDev ? 1000 : 60, // Higher limit in dev
       window: '1 m',
     },
   };
   ```

2. **Disable rate limiting for localhost:**
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
     // Skip rate limiting for localhost in development
     if (process.env.NODE_ENV === 'development') {
       return NextResponse.next();
     }

     // ... rest of middleware
   }
   ```

3. **Use different Redis database for dev/prod:**
   ```bash
   # .env.local (development)
   UPSTASH_REDIS_REST_URL=https://dev-instance.upstash.io

   # Vercel environment (production)
   UPSTASH_REDIS_REST_URL=https://prod-instance.upstash.io
   ```

### Issue: Middleware not running

**Symptoms:**
- No rate limiting at all
- Middleware file exists but not executing

**Solutions:**
1. Check `middleware.ts` is in root directory (not `/app` or `/lib`)
2. Verify `matcher` config includes your routes:
   ```typescript
   export const config = {
     matcher: ['/api/:path*'], // Should match your API routes
   };
   ```

3. Check for syntax errors:
   ```bash
   npm run build
   ```

### Issue: Redis connection errors

**Symptoms:**
- Error: "Failed to connect to Redis"
- Timeout errors in middleware

**Solutions:**
1. Verify Upstash URL format (must be HTTPS):
   ```
   https://your-instance.upstash.io (correct)
   http://your-instance.upstash.io (wrong)
   redis://your-instance.upstash.io (wrong - use REST API)
   ```

2. Check Redis instance is active in Upstash Console

3. Verify firewall/network allows HTTPS requests to Upstash

## Production Deployment

### Vercel Deployment

When deploying to Vercel:

1. **Automatic setup (if KV linked to project):**
   - Environment variables are auto-injected
   - No manual configuration needed

2. **Manual setup:**
   - Go to **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**
   - Add:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Select environments: Production, Preview, Development

3. **Verify deployment:**
   ```bash
   # Deploy to Vercel
   vercel --prod

   # Test rate limiting on production
   for i in {1..61}; do
     curl https://your-app.vercel.app/api/contacts \
       -v 2>&1 | grep X-RateLimit
   done
   ```

### Other Platforms (Netlify, Railway, etc.)

1. Create Upstash Redis instance manually: [upstash.com](https://upstash.com)
2. Copy REST API credentials
3. Add to platform's environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy application

**Note:** Vercel KV is the easiest option for Vercel deployments (auto-configured).

## Security Considerations

### Rate Limit Bypass Prevention

**Potential bypasses:**
1. **IP rotation (VPN/proxy)**: Use authenticated user ID when possible
2. **Distributed attacks**: Monitor Upstash analytics for patterns
3. **Header spoofing**: Vercel provides real IPs, don't trust client headers

**Mitigations:**
- Combine IP + User ID for authenticated endpoints
- Use webhook signature verification (not just rate limiting)
- Monitor and block suspicious IPs at Vercel edge level

### Sensitive Endpoints

For highly sensitive operations (password reset, payment processing):

**Add additional checks:**
```typescript
// In API route
export async function POST(request: NextRequest) {
  // Rate limit check (via middleware)
  // ... already checked by middleware

  // Additional verification
  const isBot = request.headers.get('user-agent')?.includes('bot');
  if (isBot) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // CAPTCHA verification for suspicious patterns
  // const captchaValid = await verifyCaptcha(request);

  // ... business logic
}
```

### GDPR Compliance

Rate limiting stores IP addresses in Redis:
- **Retention**: Automatic expiry (max 15 minutes for auth endpoints)
- **Purpose**: Security and abuse prevention (legitimate interest)
- **Data minimization**: Only IP + timestamp, no PII
- **Right to erasure**: Data auto-expires, no manual deletion needed

**Legal basis:** GDPR Article 6(1)(f) - Legitimate interests

## Performance Impact

### Latency

**Middleware overhead:**
- Redis query: ~10ms (Upstash REST API)
- Middleware execution: ~5ms
- Total: ~15ms per request

**Optimization:**
- Runs on Vercel Edge (globally distributed)
- Uses Upstash global replication (low latency)
- Sliding window algorithm (O(1) complexity)

### Scaling

**Redis limits (Upstash):**
- Free tier: 10,000 requests/day
- Pro tier: 1M+ requests/day

**Vercel Edge limits:**
- No limit on middleware executions
- Part of normal Edge Function quota

**Recommendations:**
- Free tier: Suitable for < 500 users/day
- Pro tier: Production applications with real traffic

## Cost Estimation

### Upstash Pricing (2025)

| Tier | Monthly Cost | Requests/Day | Best For |
|------|-------------|--------------|----------|
| Free | $0 | 10,000 | Development, testing |
| Pay as you go | $0.20/100k | Unlimited | Small production apps |
| Pro 2K | $120 | 2M | Production apps |

**Example calculation:**
- 100,000 API requests/day
- = 100,000 rate limit checks/day
- = 3M requests/month
- = $6/month (pay-as-you-go)

### Vercel Costs

- Edge Middleware: Included in all plans
- No additional cost for rate limiting

**Total cost:**
- Development: $0 (Upstash free tier)
- Production (100k req/day): ~$6/month (Upstash only)

## References

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel KV Quickstart](https://vercel.com/docs/storage/vercel-kv/quickstart)
- [RFC 6585 - HTTP 429 Status Code](https://tools.ietf.org/html/rfc6585)

## Support

If you encounter issues:
1. Check this documentation
2. Review Upstash Console for errors
3. Check Vercel deployment logs
4. Open GitHub issue with reproduction steps

---

**Last Updated:** 2025-12-29
**Maintained By:** Backstage Development Team
