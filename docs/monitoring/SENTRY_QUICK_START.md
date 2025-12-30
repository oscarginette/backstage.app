# Sentry Quick Start Guide

Get Sentry up and running in 5 minutes.

## Step 1: Create Sentry Account & Project

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project:
   - **Platform**: Next.js
   - **Project name**: backstage-app (or your preference)
3. Copy the **DSN** shown after project creation

## Step 2: Configure Environment Variables

Create `.env.local` file (copy from `.env.example`):

```bash
# Sentry DSN (from step 1)
SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/123456

# Organization slug (find in Sentry Settings > Organization)
SENTRY_ORG=your-organization-slug

# Project name
SENTRY_PROJECT=backstage-app
```

## Step 3: Generate Auth Token (For Source Maps)

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click **"Create New Token"**
3. Set permissions:
   - ✅ `project:releases`
   - ✅ `project:write`
4. Copy token and add to `.env.local`:

```bash
SENTRY_AUTH_TOKEN=your_token_here
```

## Step 4: Test Integration

### Start Dev Server
```bash
npm run dev
```

### Test Error Capture
```bash
# Server error test
curl http://localhost:3002/api/debug/sentry-test?type=server

# Validation error test
curl http://localhost:3002/api/debug/sentry-test?type=validation
```

### Verify in Sentry
1. Go to your Sentry project dashboard
2. Click **"Issues"** in the left sidebar
3. You should see the test errors appear within 5-10 seconds
4. Click on an error to see:
   - Stack trace
   - Request context
   - User information
   - Breadcrumbs

## Step 5: Build with Source Maps

```bash
npm run build
```

Look for this in the build output:
```
✓ Successfully uploaded source maps to Sentry
```

If you see errors, verify:
- `SENTRY_AUTH_TOKEN` is set correctly
- `SENTRY_ORG` matches your organization
- `SENTRY_PROJECT` matches your project name

## Step 6: Deploy to Production

### Add Environment Variables to Vercel

```bash
# Method 1: Vercel CLI
vercel env add SENTRY_DSN
vercel env add NEXT_PUBLIC_SENTRY_DSN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT
vercel env add SENTRY_AUTH_TOKEN

# Method 2: Vercel Dashboard
# Settings > Environment Variables > Add
```

### Deploy
```bash
vercel --prod
```

### Test Production Errors

**IMPORTANT**: The test endpoint requires authentication in production:

```bash
curl -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  https://your-domain.com/api/debug/sentry-test?type=server
```

## What's Already Configured

✅ **Sentry SDK**: Installed (`@sentry/nextjs`)
✅ **Client config**: `sentry.client.config.ts`
✅ **Server config**: `sentry.server.config.ts`
✅ **Edge config**: `sentry.edge.config.ts`
✅ **Next.js config**: `next.config.ts` (with source maps)
✅ **Error boundaries**: `app/error.tsx`, `app/global-error.tsx`
✅ **Test endpoint**: `/api/debug/sentry-test`
✅ **Use case integration**: 3 critical use cases
✅ **GDPR compliance**: All PII filtered

## GDPR Compliance (Automatic)

All configurations filter sensitive data:
- ❌ Email addresses
- ❌ Passwords
- ❌ API keys
- ❌ Tokens
- ❌ Cookie values
- ✅ User IDs (numeric only)
- ✅ Error messages
- ✅ Performance metrics

## Integration Patterns

### Quick Integration (Recommended)

Use the helper from `lib/sentry-helpers.ts`:

```typescript
import { trackUseCase } from '@/lib/sentry-helpers';

export class YourUseCase {
  async execute(input: YourInput): Promise<YourResult> {
    return trackUseCase(
      {
        name: 'YourUseCase',
        userId: input.userId,
        context: { operationType: 'create' },
        tags: { module: 'contacts' },
      },
      async () => {
        // Your business logic here
        const result = await this.yourBusinessLogic(input);
        return result;
      }
    );
  }
}
```

### Manual Integration

```typescript
import * as Sentry from '@sentry/nextjs';

export class YourUseCase {
  async execute(input: YourInput): Promise<YourResult> {
    return await Sentry.startSpan(
      { op: 'use-case', name: 'YourUseCase' },
      async () => {
        try {
          Sentry.setContext('operation', {
            userId: input.userId,
            timestamp: new Date().toISOString(),
          });

          const result = await this.yourBusinessLogic(input);
          return result;
        } catch (error) {
          Sentry.captureException(error, {
            tags: { useCase: 'YourUseCase' },
          });
          throw error;
        }
      }
    );
  }
}
```

## Troubleshooting

### Source Maps Not Working

**Symptom**: Stack traces show minified code

**Fix**:
1. Verify environment variables:
   ```bash
   echo $SENTRY_AUTH_TOKEN
   echo $SENTRY_ORG
   echo $SENTRY_PROJECT
   ```
2. Rebuild:
   ```bash
   npm run build
   ```
3. Check build logs for "Successfully uploaded source maps"

### Errors Not Appearing

**Symptom**: Errors thrown but not in Sentry

**Fix**:
1. Check `SENTRY_DSN` is correct
2. Open browser DevTools > Network tab
3. Look for requests to `sentry.io` or `/monitoring`
4. If blocked by ad-blocker, use tunnel route: `/monitoring`

### TypeScript Errors

**Symptom**: Build fails with Sentry type errors

**Fix**:
```bash
npm install @sentry/nextjs@latest
```

## Next Steps

1. ✅ **Set up alerts**: Sentry > Alerts > Create Alert Rule
2. ✅ **Configure integrations**: Slack, Email, etc.
3. ✅ **Review performance**: Sentry > Performance tab
4. ✅ **Add more use cases**: Use `trackUseCase` helper
5. ✅ **Monitor quota**: Sentry > Settings > Quota Management

## Resources

- 📖 [Full Setup Guide](../SENTRY_SETUP.md)
- 📖 [Implementation Summary](../SENTRY_IMPLEMENTATION_SUMMARY.md)
- 💻 [Helper Functions](../lib/sentry-helpers.ts)
- 🔗 [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## Support

- **Sentry Issues**: [Sentry Support](https://sentry.io/support/)
- **Implementation Questions**: Check `SENTRY_SETUP.md`
- **Helper Usage**: See examples in `lib/sentry-helpers.ts`

---

**Estimated Setup Time**: 5 minutes
**Status**: ✅ Ready for production
