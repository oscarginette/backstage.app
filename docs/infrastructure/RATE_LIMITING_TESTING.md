# Rate Limiting - Testing Cheat Sheet

Quick reference for testing rate limiting manually with curl.

## Prerequisites

```bash
# Start development server
npm run dev

# Verify server is running
curl http://localhost:3002/api/pricing
```

## Test 1: Default Rate Limit (60 req/1min)

Test the default rate limit on a general API endpoint:

```bash
# Send 61 requests to /api/contacts
for i in {1..61}; do
  echo "Request $i:"
  curl -s http://localhost:3002/api/contacts \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
done
```

**Expected Results:**
- Requests 1-60: `HTTP/1.1 200 OK` or `401 Unauthorized`
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 59, 58, 57...0`

- Request 61: `HTTP/1.1 429 Too Many Requests`
  - `X-RateLimit-Remaining: 0`
  - `Retry-After: <seconds>`

## Test 2: Auth Rate Limit (5 req/15min)

Test the strict authentication rate limit:

```bash
# Send 6 signup requests
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
- Requests 1-5: `HTTP/1.1 200 OK` or `400 Bad Request` (validation)
  - `X-RateLimit-Limit: 5`
  - `X-RateLimit-Remaining: 4, 3, 2, 1, 0`

- Request 6: `HTTP/1.1 429 Too Many Requests`
  - `Retry-After: <seconds>` (up to 900 seconds = 15 minutes)

**Important:** After being rate limited, you must wait 15 minutes or change your IP to test again.

## Test 3: Webhook Rate Limit (100 req/1min)

Test the permissive webhook rate limit:

```bash
# Send 101 requests to /api/webhooks/resend
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

## Test 4: Rate Limit Headers

Check that all responses include rate limit headers:

```bash
# Single request with full headers
curl -v http://localhost:3002/api/contacts 2>&1 | grep X-RateLimit
```

**Expected Output:**
```
< X-RateLimit-Limit: 60
< X-RateLimit-Remaining: 59
< X-RateLimit-Reset: 1735488000
```

## Test 5: 429 Response Body

Check the error response when rate limited:

```bash
# Trigger rate limit, then check response body
for i in {1..61}; do
  curl -s http://localhost:3002/api/contacts > /dev/null
done

# Get 429 response
curl -s http://localhost:3002/api/contacts | jq
```

**Expected JSON Response:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "limit": 60,
  "reset": 1735488000
}
```

## Test 6: Automated Script

Use the provided test script:

```bash
# Test default endpoint (60 requests)
./scripts/test-rate-limit.sh

# Test auth endpoint (6 requests)
./scripts/test-rate-limit.sh /api/auth/signup 6

# Test webhook endpoint (101 requests)
./scripts/test-rate-limit.sh /api/webhooks/resend 101

# Test custom endpoint
./scripts/test-rate-limit.sh /api/contacts 70
```

**Sample Output:**
```
═══════════════════════════════════════════════════════════════
  Rate Limiting Test
═══════════════════════════════════════════════════════════════
  Base URL: http://localhost:3002
  Endpoint: /api/contacts
  Requests: 61
═══════════════════════════════════════════════════════════════

✓ Server is running

Sending 61 requests to /api/contacts...

✓ Request   1: 200 (Remaining: 59/60)
✓ Request   2: 200 (Remaining: 58/60)
...
✓ Request  60: 200 (Remaining: 0/60)
⚠ Request  61: 429 RATE LIMITED (Retry-After: 45s)

═══════════════════════════════════════════════════════════════
  Results
═══════════════════════════════════════════════════════════════
  Successful:    60
  Rate Limited:  1
  Errors:        0
═══════════════════════════════════════════════════════════════

✓ Rate limiting is working!
```

## Test 7: Different Endpoints (Different Limits)

Test that different endpoints have different limits:

```bash
# Auth endpoint (should block after 5)
for i in {1..6}; do
  curl -s -X POST http://localhost:3002/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' | head -1
done

# Regular endpoint (should allow 60)
for i in {1..10}; do
  curl -s http://localhost:3002/api/contacts | head -1
done
```

**Expected:**
- Auth endpoint blocks after 5 requests
- Regular endpoint still has 50+ remaining

**Note:** This only works if you test them sequentially, as they share the same IP identifier.

## Test 8: Rate Limit Reset

Test that limits reset after the window:

```bash
# Exhaust limit
for i in {1..61}; do
  curl -s http://localhost:3002/api/contacts > /dev/null
done

# Should be rate limited
curl -s http://localhost:3002/api/contacts

# Wait 60 seconds
echo "Waiting 60 seconds for rate limit reset..."
sleep 60

# Should work again
curl -s http://localhost:3002/api/contacts
```

**Expected:**
- First request after exhausting limit: 429
- After 60 seconds: 200 (limit reset)

## Test 9: Rate Limiting Disabled (No Redis)

Test graceful degradation when Redis not configured:

```bash
# Temporarily rename .env.local (if it exists)
mv .env.local .env.local.backup

# Restart server
npm run dev

# Send many requests (should all succeed)
for i in {1..100}; do
  curl -s http://localhost:3002/api/contacts > /dev/null
done

# Check console for warning
# Should see: "⚠️  Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set"

# Restore .env.local
mv .env.local.backup .env.local
```

## Test 10: Production Testing

Test rate limiting on production deployment:

```bash
# Deploy to Vercel (if configured)
vercel --prod

# Get production URL
PROD_URL="https://your-app.vercel.app"

# Test production rate limit
for i in {1..61}; do
  echo "Request $i:"
  curl -s "$PROD_URL/api/contacts" \
    -v 2>&1 | grep -E "HTTP|X-RateLimit"
done
```

**Expected:**
- Same behavior as local testing
- Faster response times (Vercel Edge)
- Rate limits shared across all serverless instances

## Troubleshooting

### Issue: No X-RateLimit headers

**Problem:** Rate limiting may not be enabled.

**Check:**
```bash
# Check if Redis configured
grep UPSTASH .env.local

# Check server console for warning
# Should NOT see: "⚠️  Rate limiting disabled..."
```

**Solution:**
- Add Upstash credentials to `.env.local`
- Restart server

### Issue: All requests return 429

**Problem:** Rate limit may be set too low.

**Check:**
```bash
# Check rate limit configuration
grep -A 5 "RATE_LIMITS" /Users/user/Code/backstage.app/lib/rate-limit.ts
```

**Solution:**
- Increase rate limits in `lib/rate-limit.ts`
- Or wait for rate limit window to expire

### Issue: Rate limiting not working in production

**Problem:** Environment variables not set in Vercel.

**Check:**
```bash
# List Vercel environment variables
vercel env ls
```

**Solution:**
```bash
# Add environment variables
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Redeploy
vercel --prod
```

## Quick Reference

| Test | Endpoint | Expected Limit | Command |
|------|----------|----------------|---------|
| Default | `/api/contacts` | 60/min | `./scripts/test-rate-limit.sh` |
| Auth | `/api/auth/signup` | 5/15min | `./scripts/test-rate-limit.sh /api/auth/signup 6` |
| Webhook | `/api/webhooks/resend` | 100/min | `./scripts/test-rate-limit.sh /api/webhooks/resend 101` |

## Notes

- **IP-based limiting:** All tests use your IP address as identifier
- **Session persistence:** Rate limits persist across server restarts (stored in Redis)
- **Window reset:** Limits reset after the configured window (1 min or 15 min)
- **Graceful degradation:** Works without Redis (all requests allowed)

## Advanced: Test with Different IPs

To test multi-IP scenarios (requires VPN or proxy):

```bash
# Request from normal IP
curl http://localhost:3002/api/contacts

# Request from VPN IP
# (connect to VPN, then:)
curl http://localhost:3002/api/contacts

# Each IP should have independent rate limit counter
```

## Advanced: Test User-Specific Limiting

After integrating with NextAuth (see documentation):

```bash
# Login and get session cookie
SESSION_COOKIE="next-auth.session-token=<your-token>"

# Test with authenticated user
for i in {1..61}; do
  curl -s http://localhost:3002/api/contacts \
    -H "Cookie: $SESSION_COOKIE" > /dev/null
done
```

**Expected:** Rate limits are per-user, not per-IP.

---

**For complete setup and configuration, see:**
- `/Users/user/Code/backstage.app/RATE_LIMITING_SETUP.md` (Full guide)
- `/Users/user/Code/backstage.app/lib/rate-limit.README.md` (Quick reference)
