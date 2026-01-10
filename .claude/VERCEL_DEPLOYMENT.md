# Vercel Deployment Guide

## Quick Reference: Environment Variables

### Build-Time Requirements

**CRITICAL**: These variables **MUST** be set in Vercel for the build to succeed:

- `POSTGRES_URL` - PostgreSQL connection string (required for Prisma schema generation)

**That's it!** Only one variable is required for the build to complete.

### Runtime-Only Variables

These variables are **NOT** required during build, but **MUST** be set before the app starts serving traffic:

**Email Configuration** (required for sending emails):
- `SENDER_EMAIL` - Email address for the "From" field
- `RESEND_API_KEY` - Resend API key (starts with `re_`)

**Security** (required for OAuth token encryption):
- `TOKEN_ENCRYPTION_KEY` - 64-character hex string (generate with: `openssl rand -hex 32`)

**Authentication** (required for user login):
- `NEXTAUTH_URL` - Full application URL (e.g., `https://thebackstage.app`)
- `NEXTAUTH_SECRET` or `AUTH_SECRET` - Random secret for session encryption (min 32 chars)

**Optional Services**:
- Stripe, Cloudinary, Spotify, SoundCloud credentials (see `.env.example`)

## How It Works

### Architecture

The `lib/env.ts` file uses **build-time awareness** to differentiate between:
1. **Build-time validation** - Only validates variables needed for Next.js compilation
2. **Runtime validation** - Validates all variables when the app starts serving requests

### Why This Matters

During Vercel deployment:
1. **Build Phase**: Runs in a sandboxed environment without runtime secrets
   - Only validates `POSTGRES_URL` (needed for Prisma)
   - Allows build to succeed even if `SENDER_EMAIL`, `TOKEN_ENCRYPTION_KEY`, etc. are missing

2. **Runtime Phase**: Vercel injects environment variables from project settings
   - Full validation occurs when the app starts
   - App will fail to start if required runtime variables are invalid

### Security Guarantees

✅ **No security compromise**: All runtime variables are validated before use
✅ **Fail-fast**: App won't start if critical variables are missing
✅ **Type-safe**: Zod ensures correct types and formats
✅ **Defense in depth**: Additional validation in `TokenEncryption` and `ResendEmailProvider`

## Deployment Checklist

### First-Time Setup

1. **Set POSTGRES_URL in Vercel**:
   ```bash
   vercel env add POSTGRES_URL production
   # Paste your PostgreSQL connection string
   ```

2. **Deploy** (build will succeed):
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

3. **Add runtime variables in Vercel dashboard**:
   - Go to: Project Settings → Environment Variables
   - Add all runtime-only variables listed above
   - **Important**: Mark them as "Production" + "Preview" as needed

4. **Redeploy** (trigger a new deployment to pick up new env vars):
   ```bash
   vercel --prod
   ```

### Updating Environment Variables

**For build-time variables (POSTGRES_URL)**:
- Changes require a new build
- Add/update in Vercel, then trigger deployment

**For runtime-only variables (SENDER_EMAIL, etc.)**:
- Changes take effect immediately on next function invocation
- No rebuild required
- Update in Vercel dashboard

## Troubleshooting

### Build fails with "POSTGRES_URL missing"
- **Cause**: `POSTGRES_URL` is not set in Vercel
- **Fix**: Add it via `vercel env add POSTGRES_URL production`

### Build succeeds but app crashes at runtime
- **Cause**: Runtime-only variables are missing or invalid
- **Fix**: Check Vercel logs for specific missing variables, add them in dashboard

### "SENDER_EMAIL is required" error when sending emails
- **Cause**: Variable not set or set to empty string
- **Fix**: Add valid email in Vercel: `vercel env add SENDER_EMAIL production`

### "TOKEN_ENCRYPTION_KEY must be 64 characters" error
- **Cause**: Invalid or missing encryption key
- **Fix**: Generate and add: `openssl rand -hex 32 | vercel env add TOKEN_ENCRYPTION_KEY production --stdin`

## Testing Locally

To test the build-time vs runtime separation locally:

```bash
# Test build-time validation (only POSTGRES_URL required)
POSTGRES_URL="postgresql://..." npm run build

# Test runtime validation (all variables checked)
npm run dev
# App will fail to start if runtime variables are missing
```

## Migration from Previous Setup

If you're migrating from a setup that required all variables at build time:

1. **Before**: All variables had to be set in Vercel before build
2. **After**: Only `POSTGRES_URL` required for build
3. **Benefit**: Cleaner separation of concerns, faster iterations

**No code changes needed** - the env validation system handles this automatically.

---

**Last Updated**: 2026-01-10
**Architecture**: Clean Architecture + SOLID + Build/Runtime Separation
