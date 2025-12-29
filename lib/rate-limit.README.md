# Rate Limiting - Quick Reference

## Files Created

1. **`/Users/user/Code/backstage.app/lib/rate-limit.ts`**
   - Core rate limiting logic
   - Upstash Redis configuration
   - Helper functions for middleware and API routes

2. **`/Users/user/Code/backstage.app/middleware.ts`**
   - Next.js Edge Middleware
   - Runs on all `/api/*` routes
   - Applies rate limiting before API handlers

3. **`/Users/user/Code/backstage.app/RATE_LIMITING_SETUP.md`**
   - Complete setup and testing guide
   - Troubleshooting instructions
   - Production deployment guide

4. **`/Users/user/Code/backstage.app/scripts/test-rate-limit.sh`**
   - Automated testing script
   - Tests different endpoints and limits

## Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

Already done! ✓

### 2. Create Upstash Redis Instance

**Option A: Vercel Dashboard (Easiest)**
1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database** → **KV**
3. Name it (e.g., "backstage-rate-limit")
4. Copy credentials

**Option B: Upstash Direct**
1. Go to https://upstash.com
2. Create account and database
3. Copy REST API credentials

### 3. Add Environment Variables

Create or update `.env.local`:

```bash
# Rate Limiting - Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 4. Start Server

```bash
npm run dev
```

You should NOT see this warning:
```
⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set
```

If you see the warning, check your `.env.local` file.

### 5. Test Rate Limiting

**Quick test (manual):**
```bash
# Send 61 requests quickly
for i in {1..61}; do
  curl -s http://localhost:3002/api/contacts | head -1
done
```

You should see "Too many requests" after 60 successful requests.

**Automated test:**
```bash
./scripts/test-rate-limit.sh
```

## Rate Limits Configuration

| Endpoint | Limit | Window | Use Case |
|----------|-------|--------|----------|
| `/api/auth/*` | 5 | 15 min | Prevent brute force attacks |
| `/api/emails/send` | 10 | 1 min | Prevent email spam |
| `/api/webhooks/*` | 100 | 1 min | Allow legitimate webhooks |
| All others | 60 | 1 min | General API protection |

## How It Works

```
User Request
    ↓
Next.js Middleware (middleware.ts)
    ↓
Check Rate Limit (lib/rate-limit.ts)
    ↓
Query Upstash Redis
    ↓
Rate Limit OK?
├─ YES → Add headers, continue to API route
└─ NO  → Return 429 Too Many Requests
```

## Response Headers

Every API response includes rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1735488000
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735488000
Retry-After: 45
Content-Type: application/json

{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "limit": 60,
  "reset": 1735488000
}
```

## Testing Examples

### Test Default Rate Limit (60 req/min)

```bash
# Send 61 requests
for i in {1..61}; do
  curl -s http://localhost:3002/api/contacts \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
done
```

Expected: First 60 succeed, 61st returns 429.

### Test Auth Rate Limit (5 req/15min)

```bash
# Send 6 signup requests
for i in {1..6}; do
  curl -s -X POST http://localhost:3002/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\"}" \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
done
```

Expected: First 5 may succeed (or fail validation), 6th returns 429.

### Test with Automated Script

```bash
# Test default endpoint (60 req)
./scripts/test-rate-limit.sh

# Test auth endpoint (5 req)
./scripts/test-rate-limit.sh /api/auth/signup 6

# Test webhook endpoint (100 req)
./scripts/test-rate-limit.sh /api/webhooks/resend 101
```

## Customizing Rate Limits

Edit `/Users/user/Code/backstage.app/lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  auth: {
    requests: 10,        // Increase from 5 to 10
    window: '30 m',      // Increase from 15m to 30m
    description: 'Authentication routes',
  },
  // ... other limits
};
```

Window format:
- `'10 s'` = 10 seconds
- `'1 m'` = 1 minute
- `'1 h'` = 1 hour
- `'1 d'` = 1 day

Restart server after changes:
```bash
npm run dev
```

## Graceful Degradation

**Without Redis configured:**
- Rate limiting is disabled
- All requests pass through
- Warning logged to console
- Application continues to work

**Why?**
- Allows local development without Redis
- Prevents deployment failures
- Can deploy first, add Redis later

**Production recommendation:**
- ALWAYS configure Redis for production
- Monitor in Upstash Console
- Set up alerts for high traffic

## Common Issues

### "Rate limiting disabled" warning

**Problem:** Redis credentials not set.

**Solution:**
```bash
# Check if variables are set
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# If empty, add to .env.local
cat >> .env.local << EOF
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
EOF

# Restart server
npm run dev
```

### Rate limiting not working in production

**Problem:** Environment variables not set in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Select: Production, Preview, Development
4. Redeploy: `vercel --prod`

### Too many 429 errors in development

**Problem:** Rate limits too strict for development.

**Solution A:** Increase limits for development:
```typescript
// lib/rate-limit.ts
const isDev = process.env.NODE_ENV === 'development';

export const RATE_LIMITS = {
  default: {
    requests: isDev ? 1000 : 60,
    window: '1 m',
  },
};
```

**Solution B:** Disable rate limiting for localhost:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next(); // Skip rate limiting
  }
  // ... rest of middleware
}
```

## Integration with NextAuth (User-Specific Limiting)

For user-specific rate limiting (recommended for email sending):

**Edit `middleware.ts`:**
```typescript
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get authenticated user ID
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userId = token?.sub;

  // Check rate limit with user ID
  const result = await checkRateLimit(request, userId);

  // ... rest of middleware
}
```

**Benefits:**
- Prevents multi-IP abuse (users can't bypass via VPN)
- More accurate for user actions (email sending)
- Better UX (users see their own limits)

## Monitoring

### Upstash Console

View analytics:
1. Go to https://console.upstash.com/
2. Select your database
3. Navigate to **Analytics**

**Metrics:**
- Total requests
- Blocked requests (rate limited)
- Peak traffic times
- Per-endpoint statistics

### Vercel Analytics

When deployed:
1. Go to Vercel Dashboard → Project → Analytics
2. Filter by status code `429`
3. Check Edge Middleware logs

### Custom Logging

Add to `middleware.ts`:
```typescript
if (!result.success) {
  console.warn('Rate limit exceeded:', {
    path: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for'),
    userId,
    limit: result.limit,
  });
}
```

## Architecture - Clean Architecture Compliance

```
┌─────────────────────────────────────────────────┐
│ Presentation Layer (Next.js API Routes)        │
│ - app/api/**/*.ts                               │
│ - Clean, focused on business logic              │
│ - NO rate limiting logic here                   │
└─────────────────────────────────────────────────┘
                     ↑
                     │
┌─────────────────────────────────────────────────┐
│ Infrastructure Layer (Rate Limiting)            │
│                                                  │
│ middleware.ts                                    │
│ ├─ Runs on every API request                    │
│ ├─ Checks rate limit BEFORE route handler       │
│ └─ Returns 429 if limit exceeded                │
│                                                  │
│ lib/rate-limit.ts                                │
│ ├─ Upstash Redis configuration                  │
│ ├─ Rate limit logic (check, headers, response)  │
│ └─ Helper functions                             │
└─────────────────────────────────────────────────┘
                     ↑
                     │
┌─────────────────────────────────────────────────┐
│ External Service (Upstash Redis / Vercel KV)   │
│ - Distributed rate limiting                     │
│ - Shared across serverless instances            │
│ - Low latency (<10ms)                           │
└─────────────────────────────────────────────────┘
```

**Key Principles:**
- ✓ Rate limiting is infrastructure concern (not business logic)
- ✓ API routes remain clean and focused
- ✓ Easy to test (mock Redis for unit tests)
- ✓ Easy to replace (change from Upstash to Redis, etc.)
- ✓ Dependency inversion (business logic doesn't depend on Redis)

## Cost

**Upstash (2025 pricing):**
- Free tier: 10,000 requests/day ($0/month)
- Pay-as-you-go: $0.20 per 100k requests
- Pro 2K: 2M requests/day ($120/month)

**Example:**
- 100,000 API requests/day
- = 3M requests/month
- = $6/month (pay-as-you-go)

**Vercel:**
- Edge Middleware: Included in all plans
- No additional cost

**Total for small app:**
- Development: $0 (free tier)
- Production (100k req/day): ~$6/month

## Security Considerations

**What rate limiting protects against:**
- ✓ DDoS attacks (distributed denial of service)
- ✓ Brute force attacks (authentication)
- ✓ API abuse (excessive requests)
- ✓ Email spam (bulk sending)
- ✓ Credential stuffing
- ✓ Scraping/crawling

**What it does NOT protect against:**
- ✗ SQL injection (use parameterized queries)
- ✗ XSS attacks (use React escaping)
- ✗ CSRF (use NextAuth CSRF tokens)
- ✗ Authentication bypass (use proper auth checks)

**Defense in depth:**
Rate limiting is ONE layer of security. Always implement:
1. Input validation (Zod schemas)
2. Authentication (NextAuth)
3. Authorization (role checks)
4. Rate limiting (this implementation)
5. Webhook signature verification
6. SQL parameterization

## Next Steps

1. **Deploy to production:**
   ```bash
   vercel --prod
   ```

2. **Monitor in Upstash Console:**
   - Check analytics weekly
   - Look for abuse patterns
   - Adjust limits as needed

3. **Add user-specific limiting:**
   - Integrate with NextAuth (see above)
   - Better protection for authenticated routes

4. **Set up alerts:**
   - High rate of 429 errors
   - Unusual traffic patterns
   - Redis errors

5. **Document for team:**
   - Share setup guide
   - Explain rate limits to frontend team
   - Add to API documentation

## Further Reading

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel KV Quickstart](https://vercel.com/docs/storage/vercel-kv/quickstart)
- [RFC 6585 - HTTP 429](https://tools.ietf.org/html/rfc6585)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

---

**Questions?** Check `/Users/user/Code/backstage.app/RATE_LIMITING_SETUP.md` for detailed setup guide.
