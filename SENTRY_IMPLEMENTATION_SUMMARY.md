# Sentry Implementation Summary

Complete implementation of Sentry error tracking and observability for Backstage App.

## What Was Implemented

### 1. Core Configuration Files

#### `sentry.client.config.ts`
- **Purpose**: Monitors client-side (browser) errors
- **Features**:
  - Session replay with privacy controls (mask text, block media)
  - GDPR-compliant data filtering
  - Removes sensitive headers and query parameters
  - Ignores common browser extension errors
- **Sample Rate**: 10% in production, 100% in development

#### `sentry.server.config.ts`
- **Purpose**: Monitors server-side errors (API routes, server components)
- **Features**:
  - HTTP request tracking with tracing
  - Custom `sanitizeData()` function for PII removal
  - Filters sensitive headers, cookies, API keys
  - Sanitizes request bodies and context data
- **Sample Rate**: 10% in production, 100% in development

#### `sentry.edge.config.ts`
- **Purpose**: Monitors Edge Runtime (middleware)
- **Features**:
  - Lightweight configuration for edge environments
  - Basic header filtering
- **Sample Rate**: 5% in production, 100% in development

#### `next.config.ts` (Updated)
- **Changes**:
  - Wrapped with `withSentryConfig()` for automatic instrumentation
  - Enables source map upload during build
  - Configures tunnel route `/monitoring` to bypass ad-blockers
  - Auto-instruments server functions and middleware

---

### 2. Error Boundaries

#### `app/error.tsx`
- **Purpose**: Global error boundary for application errors
- **Features**:
  - Captures all unhandled client-side errors
  - Reports errors to Sentry automatically
  - User-friendly error UI with recovery options
  - Shows error details in development mode
  - Provides "Try again" and "Go to home" buttons

#### `app/global-error.tsx`
- **Purpose**: Root layout error boundary
- **Features**:
  - Fallback for critical errors in root layout
  - Minimal HTML/CSS (no dependencies)
  - Captures errors that `app/error.tsx` can't catch

---

### 3. Testing Infrastructure

#### `/api/debug/sentry-test/route.ts`
- **Purpose**: Test endpoint to verify Sentry integration
- **Error Types**:
  - `?type=server` - InternalServerError
  - `?type=validation` - ValidationError
  - `?type=async` - Async error
  - `?type=quota` - QuotaExceededError
  - `?type=message` - Info message
  - (default) - Generic error
- **Security**: Requires `x-admin-secret` header in production

**Usage**:
```bash
# Development
curl http://localhost:3002/api/debug/sentry-test?type=server

# Production
curl -H "x-admin-secret: your_secret" \
  https://your-domain.com/api/debug/sentry-test?type=server
```

---

### 4. Use Case Integration

Integrated Sentry into 3 critical use cases:

#### `SendTrackEmailUseCase`
- **Tracking**:
  - Transaction for performance monitoring
  - Email sending duration
  - Quota usage metrics
- **Context**:
  - User ID
  - Subject/HTML presence (not content)
  - Timestamp
- **Error Handling**:
  - Captures all email sending errors
  - Tags: `useCase: 'SendTrackEmail'`, `userId`
  - Sanitized input (no email content)

#### `ImportContactsUseCase`
- **Tracking**:
  - Transaction for import operation
  - Import duration measurement
  - Contacts inserted/updated count
- **Context**:
  - User ID
  - Contact count
  - File type (csv/json/brevo)
  - Total rows
- **Error Handling**:
  - Captures import failures
  - Tags: `useCase: 'ImportContacts'`, `userId`, `fileType`
  - Import ID for traceability

#### `ProcessEmailEventUseCase`
- **Tracking**:
  - Transaction for webhook processing
  - Webhook type tracking
  - Email event metrics
- **Context**:
  - Webhook type
  - Email log ID
  - Contact ID, Track ID
- **Special Handling**:
  - Warnings for missing email logs
  - Info messages for unhandled webhook types
  - Sanitizes webhook data (removes PII)

---

### 5. Utility Helpers

#### `lib/sentry-helpers.ts`
- **Purpose**: Reusable utilities for Sentry integration
- **Functions**:

```typescript
// Wrap use case execution with automatic error tracking
trackUseCase(options, execution)

// Remove PII from data before sending to Sentry
sanitizeForSentry(data)

// Track custom performance metrics
trackMeasurement(name, value)

// Capture warnings and info messages
captureWarning(message, extra)
captureInfo(message, extra)

// Manually capture errors with context
captureError(error, options)

// Add breadcrumbs for user actions
addBreadcrumb(message, data)
```

**Example Usage**:
```typescript
import { trackUseCase } from '@/lib/sentry-helpers';

async execute(input: MyInput): Promise<MyResult> {
  return trackUseCase(
    {
      name: 'MyUseCase',
      userId: input.userId,
      context: { operationType: 'create' },
      tags: { module: 'contacts' },
    },
    async () => {
      // Business logic here
      return result;
    }
  );
}
```

---

### 6. Configuration Updates

#### `.env.example`
Added Sentry environment variables:
```bash
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=backstage-app
SENTRY_AUTH_TOKEN=your_auth_token
```

#### `.gitignore`
Added Sentry-specific files:
```
.sentryclirc
sentry.properties
```

---

### 7. Documentation

#### `SENTRY_SETUP.md`
- Complete setup guide for Sentry integration
- Step-by-step instructions for project creation
- Testing procedures
- GDPR compliance guidelines
- Troubleshooting section
- Production checklist

#### `SENTRY_IMPLEMENTATION_SUMMARY.md` (this file)
- High-level overview of implementation
- File descriptions
- Integration patterns
- Usage examples

---

## GDPR Compliance

### Data Filtering Strategy

**Client-side** (`sentry.client.config.ts`):
- ✅ Removes `authorization`, `cookie`, `set-cookie` headers
- ✅ Filters query parameters: `token`, `email`
- ✅ Masks all text in session replay
- ✅ Blocks images/videos in session replay

**Server-side** (`sentry.server.config.ts`):
- ✅ Custom `sanitizeData()` function
- ✅ Filters: `email`, `password`, `token`, `secret`, `apikey`, `cookie`
- ✅ Sanitizes request bodies, contexts, and extra data
- ✅ Removes sensitive headers

**Use Cases**:
- ✅ Only metadata sent (user ID, counts, durations)
- ✅ No email addresses or content
- ✅ No personal information
- ✅ Sanitized webhook data

### What Gets Sent to Sentry

**Safe to send**:
- User IDs (numeric)
- Error messages and stack traces
- Request URLs (without sensitive params)
- Performance metrics (duration, counts)
- Operation types (e.g., "import", "send_email")

**Never sent**:
- Email addresses
- Passwords or API keys
- Email content (subject, HTML, text)
- Cookie values
- Personal information

---

## Performance Monitoring

### Tracked Metrics

1. **Email Sending** (SendTrackEmailUseCase):
   - Transaction duration
   - Quota remaining
   - Success/failure rate

2. **Contact Import** (ImportContactsUseCase):
   - Import duration (`import_duration_ms`)
   - Contacts inserted (`contacts_inserted`)
   - Contacts updated (`contacts_updated`)
   - Batch size (500 contacts per batch)

3. **Webhook Processing** (ProcessEmailEventUseCase):
   - Processing duration
   - Event type distribution
   - Missing email log warnings

### Viewing Performance Data

1. Go to Sentry dashboard
2. Navigate to **Performance** tab
3. Filter by operation: `use-case`
4. View transaction details and custom measurements

---

## Next Steps

### 1. Create Sentry Project
1. Go to [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Copy DSN and add to `.env.local`

### 2. Configure Auth Token
1. Generate token at: https://sentry.io/settings/account/api/auth-tokens/
2. Permissions: `project:releases`, `project:write`
3. Add to `.env.local` as `SENTRY_AUTH_TOKEN`

### 3. Test Integration
```bash
# Start dev server
npm run dev

# Test error endpoint
curl http://localhost:3002/api/debug/sentry-test?type=server

# Check Sentry dashboard for errors
```

### 4. Build with Source Maps
```bash
npm run build
```
- Verify source maps upload in build logs
- Check Sentry dashboard for source map files

### 5. Deploy to Production
- Add environment variables to Vercel/hosting platform
- Test endpoint disabled or protected in production
- Verify errors appear in Sentry with readable stack traces

### 6. Integrate More Use Cases (Optional)
Use the pattern from existing use cases or use `lib/sentry-helpers.ts`:

```typescript
import { trackUseCase } from '@/lib/sentry-helpers';

async execute(input: YourInput): Promise<YourResult> {
  return trackUseCase(
    {
      name: 'YourUseCase',
      userId: input.userId,
      tags: { module: 'your-module' },
    },
    async () => {
      // Your business logic
      return result;
    }
  );
}
```

---

## Files Created/Modified

### Created:
- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `app/error.tsx` - Global error boundary
- `app/global-error.tsx` - Root layout error boundary
- `app/api/debug/sentry-test/route.ts` - Test endpoint
- `lib/sentry-helpers.ts` - Utility functions
- `SENTRY_SETUP.md` - Setup documentation
- `SENTRY_IMPLEMENTATION_SUMMARY.md` - This file

### Modified:
- `next.config.ts` - Added Sentry webpack plugin
- `.env.example` - Added Sentry environment variables
- `.gitignore` - Added Sentry files
- `domain/services/SendTrackEmailUseCase.ts` - Integrated Sentry
- `domain/services/ImportContactsUseCase.ts` - Integrated Sentry
- `domain/services/ProcessEmailEventUseCase.ts` - Integrated Sentry
- `package.json` - Added `@sentry/nextjs@^10.32.1`

---

## Dependencies Added

```json
{
  "@sentry/nextjs": "^10.32.1"
}
```

Total additional dependencies: 99 packages (Sentry SDK and transitive dependencies)

---

## Production Readiness Checklist

Before deploying to production:

- [ ] Sentry project created at sentry.io
- [ ] `SENTRY_DSN` configured in production environment
- [ ] `SENTRY_AUTH_TOKEN` set for source map upload
- [ ] `SENTRY_ORG` and `SENTRY_PROJECT` configured
- [ ] Test endpoint protected with `ADMIN_SECRET`
- [ ] Build successful with source maps uploaded
- [ ] Test an error in production and verify in Sentry
- [ ] Verify no PII in Sentry events
- [ ] Set up alerts in Sentry for critical errors
- [ ] Configure issue assignment rules
- [ ] Review `ignoreErrors` configuration
- [ ] Adjust sample rates if needed (default: 10%)

---

## Support & Troubleshooting

### Common Issues

1. **Source maps not working**
   - Verify `SENTRY_AUTH_TOKEN` is set
   - Check `SENTRY_ORG` and `SENTRY_PROJECT` match
   - Rebuild: `npm run build`

2. **Errors not appearing**
   - Verify `SENTRY_DSN` is correct
   - Check network tab for Sentry requests
   - Use tunnel route: `/monitoring`

3. **Too many errors**
   - Lower `tracesSampleRate` (default: 0.1)
   - Add to `ignoreErrors` array
   - Configure filters in Sentry dashboard

### Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [SENTRY_SETUP.md](./SENTRY_SETUP.md) - Detailed setup guide
- [lib/sentry-helpers.ts](./lib/sentry-helpers.ts) - Utility functions

---

**Implementation Date**: 2025-12-29
**Sentry SDK Version**: 10.32.1
**Status**: ✅ Complete and ready for production
