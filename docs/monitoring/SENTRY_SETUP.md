# Sentry Setup Guide - Backstage App

Complete guide for setting up Sentry error tracking and observability in production.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [GDPR Compliance](#gdpr-compliance)
6. [Use Case Integration](#use-case-integration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Sentry provides:
- **Error Tracking**: Capture and track all errors in production
- **Performance Monitoring**: Track slow queries, API calls, and use case execution
- **Observability**: Rich context for debugging (user ID, request data, stack traces)
- **Source Maps**: View original TypeScript code in error stack traces
- **GDPR Compliance**: All PII is filtered before sending to Sentry

---

## Setup Instructions

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - Platform: **Next.js**
   - Project name: **backstage-app**
3. Copy the **DSN** from the project settings

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Sentry DSN (from Sentry project settings)
SENTRY_DSN=https://your_public_key@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://your_public_key@o123456.ingest.sentry.io/123456

# Organization and project (for source maps upload)
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=backstage-app

# Auth token (for uploading source maps during build)
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

### 3. Generate Sentry Auth Token

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Permissions needed:
   - `project:releases`
   - `project:write`
4. Copy the token and add to `.env.local`

### 4. Install Dependencies

Already installed:
```bash
npm install @sentry/nextjs
```

---

## Configuration

### Files Created

#### 1. `sentry.client.config.ts`
- Monitors client-side (browser) errors
- Includes session replay for debugging
- GDPR-compliant data filtering

#### 2. `sentry.server.config.ts`
- Monitors server-side errors (API routes, server components)
- Filters sensitive headers and request data
- Custom data sanitization

#### 3. `sentry.edge.config.ts`
- Monitors Edge Runtime (middleware)
- Lightweight configuration for edge environments

#### 4. `next.config.ts`
- Wraps Next.js config with `withSentryConfig()`
- Automatically uploads source maps during build
- Enables auto-instrumentation

#### 5. `app/error.tsx`
- Global error boundary
- Captures all client-side errors
- User-friendly error UI

#### 6. `app/global-error.tsx`
- Root layout error boundary
- Fallback for critical errors

---

## Testing

### Test Endpoint

URL: `/api/debug/sentry-test`

**Usage:**

```bash
# Test server error
curl http://localhost:3002/api/debug/sentry-test?type=server

# Test validation error
curl http://localhost:3002/api/debug/sentry-test?type=validation

# Test async error
curl http://localhost:3002/api/debug/sentry-test?type=async

# Test quota exceeded error
curl http://localhost:3002/api/debug/sentry-test?type=quota

# Test message (info level)
curl http://localhost:3002/api/debug/sentry-test?type=message

# Test generic error
curl http://localhost:3002/api/debug/sentry-test
```

**Production Protection:**

In production, the test endpoint requires `x-admin-secret` header:

```bash
curl -H "x-admin-secret: your_admin_secret" \
  https://your-domain.com/api/debug/sentry-test?type=server
```

**Verify in Sentry:**

1. Go to your Sentry project dashboard
2. Navigate to **Issues** tab
3. You should see the test errors appear within seconds
4. Click on an error to see:
   - Stack trace with source maps
   - Request context
   - User context
   - Breadcrumbs

---

## GDPR Compliance

### Data Filtering

All sensitive data is filtered before sending to Sentry:

#### Client-side (`sentry.client.config.ts`)
- ✅ Removes `authorization`, `cookie`, `set-cookie` headers
- ✅ Filters query parameters: `token`, `email`
- ✅ Masks all text in session replay
- ✅ Blocks images/videos in session replay

#### Server-side (`sentry.server.config.ts`)
- ✅ Removes sensitive headers
- ✅ Filters request body fields: `email`, `password`, `token`, `secret`
- ✅ Sanitizes all context data
- ✅ Custom `sanitizeData()` function

### PII Handling

**Never sent to Sentry:**
- Email addresses
- Passwords
- API keys
- Tokens
- Cookie values
- Request bodies with user data

**Safe to send:**
- User IDs (numeric)
- Error messages
- Stack traces
- Request URLs (without sensitive params)
- Performance metrics

---

## Use Case Integration

### Pattern for All Use Cases

```typescript
import * as Sentry from '@sentry/nextjs';

export class YourUseCase {
  async execute(input: YourInput): Promise<YourResult> {
    // Start transaction for performance monitoring
    const transaction = Sentry.startTransaction({
      op: 'use-case',
      name: 'YourUseCase',
    });

    try {
      // Add context (without PII)
      Sentry.setContext('your_operation', {
        userId: input.userId,
        operationType: 'example',
        timestamp: new Date().toISOString(),
      });

      // Your business logic here
      const result = await this.doSomething(input);

      // Track metrics
      Sentry.setMeasurement('operation_duration_ms', Date.now() - startTime);

      return result;
    } catch (error) {
      // Capture error with context
      Sentry.captureException(error, {
        tags: {
          useCase: 'YourUseCase',
          userId: input.userId.toString(),
        },
        extra: {
          // Sanitized data only
          operationType: input.operationType,
          itemCount: input.items?.length || 0,
        },
      });

      throw error;
    } finally {
      transaction.finish();
    }
  }
}
```

### Integrated Use Cases

1. **SendTrackEmailUseCase**
   - Tracks email sending performance
   - Captures quota errors
   - Filters email content (GDPR)

2. **ImportContactsUseCase**
   - Monitors import duration
   - Tracks batch processing
   - Filters contact data (GDPR)

3. **ProcessEmailEventUseCase**
   - Tracks webhook processing
   - Captures missing email logs
   - Sanitizes webhook data

---

## Performance Monitoring

### Metrics Tracked

- **Email Sending**: Duration, quota usage, success rate
- **Contact Import**: Duration, inserted/updated counts, batch size
- **Webhook Processing**: Processing time, event type distribution

### Custom Measurements

```typescript
// Track custom performance metrics
Sentry.setMeasurement('import_duration_ms', 5000);
Sentry.setMeasurement('contacts_inserted', 150);
Sentry.setMeasurement('batch_size', 500);
```

### Viewing Metrics

1. Go to Sentry project
2. Navigate to **Performance** tab
3. Filter by operation: `use-case`
4. View transaction details and measurements

---

## Troubleshooting

### Source Maps Not Working

**Problem**: Stack traces show minified code instead of TypeScript.

**Solution**:
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match Sentry settings
3. Rebuild: `npm run build`
4. Check build logs for source map upload confirmation

### Errors Not Appearing in Sentry

**Problem**: Errors are thrown but don't show in Sentry dashboard.

**Solution**:
1. Verify `SENTRY_DSN` is correct
2. Check network tab for outgoing Sentry requests
3. Ensure you're not blocking `sentry.io` in ad-blockers
4. Use tunnel route: `/monitoring` (configured in `next.config.ts`)

### Too Many Errors in Production

**Problem**: Sentry quota exceeded due to spam errors.

**Solution**:
1. Adjust `ignoreErrors` in `sentry.*.config.ts`
2. Lower `tracesSampleRate` (default: 0.1 = 10%)
3. Add error filters in Sentry dashboard

### GDPR Compliance Issues

**Problem**: PII appearing in Sentry events.

**Solution**:
1. Review `beforeSend` hooks in `sentry.*.config.ts`
2. Update `sanitizeData()` function to filter new fields
3. Use Sentry data scrubbing rules in project settings

---

## Production Checklist

Before deploying to production:

- [ ] `SENTRY_DSN` configured in production environment
- [ ] `SENTRY_AUTH_TOKEN` set for source map upload
- [ ] Test endpoint disabled or protected with `ADMIN_SECRET`
- [ ] Source maps uploaded successfully (check build logs)
- [ ] Test an error in production and verify it appears in Sentry
- [ ] Verify no PII in Sentry events (check dashboard)
- [ ] Set up alerts in Sentry for critical errors
- [ ] Configure issue assignment rules in Sentry

---

## Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Data Scrubbing](https://docs.sentry.io/product/data-management-settings/scrubbing/server-side-scrubbing/)
- [Alerts & Notifications](https://docs.sentry.io/product/alerts-notifications/)

---

## Support

For issues related to Sentry integration:

1. Check Sentry project dashboard for error patterns
2. Review stack traces with source maps
3. Check request context and breadcrumbs
4. Use `extra` context for debugging

**Remember**: Sentry is your production safety net. All critical use cases should have Sentry integration for complete observability.
