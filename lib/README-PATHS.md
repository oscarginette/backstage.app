# Centralized Path Configuration System

## Overview

This project uses a centralized path configuration system to prevent broken links and ensure type-safety across all navigation.

## Location

**Main file:** `lib/paths.ts`

## Benefits

✅ **Type Safety**: All paths are centralized and TypeScript will catch errors if paths are renamed or removed
✅ **No Broken Links**: Single source of truth for all routes
✅ **Maintainability**: Path changes only need to be made in one location
✅ **Query Parameters**: Built-in helper for type-safe URL construction with query params
✅ **Consistency**: All navigation uses the same PATHS constants throughout the app

## Usage

### Basic Navigation

```tsx
import { PATHS } from '@/lib/paths';
import Link from 'next/link';

// Simple link
<Link href={PATHS.LOGIN}>Login</Link>

// Nested paths
<Link href={PATHS.DASHBOARD.ROOT}>Dashboard</Link>
<Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}>Create Gate</Link>
```

### Dynamic Routes

```tsx
import { PATHS } from '@/lib/paths';

// Function-based paths for dynamic routes
const gateId = '123';
<Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.DETAILS(gateId)}>
  View Gate
</Link>

// Gate by slug
<Link href={PATHS.GATE.VIEW('my-track-gate')}>
  Public Gate
</Link>
```

### Query Parameters

```tsx
import { PATHS, buildUrl } from '@/lib/paths';
import { useRouter } from 'next/navigation';

const router = useRouter();

// Build URL with query parameters
router.push(buildUrl(PATHS.LOGIN, { redirect: '/dashboard' }));
// Results in: /login?redirect=%2Fdashboard

// Multiple parameters
router.push(buildUrl(PATHS.DASHBOARD.ROOT, {
  tab: 'engagement',
  filter: 'recent'
}));
// Results in: /dashboard?tab=engagement&filter=recent
```

### Server-side Navigation

```tsx
import { PATHS } from '@/lib/paths';
import { redirect } from 'next/navigation';

// In Server Components or API routes
if (!session) {
  redirect(PATHS.LOGIN);
}

// Or
return NextResponse.redirect(new URL(PATHS.DASHBOARD.ROOT, request.url));
```

## Available Paths

### Public Pages
- `PATHS.HOME` → `/`
- `PATHS.LOGIN` → `/login`
- `PATHS.SIGNUP` → `/signup`
- `PATHS.PRICING` → `/pricing`

### Authentication & Settings
- `PATHS.SETTINGS` → `/settings`
- `PATHS.UNSUBSCRIBE` → `/unsubscribe`

### Dashboard
- `PATHS.DASHBOARD.ROOT` → `/dashboard`
- `PATHS.DASHBOARD.TEMPLATES.ROOT` → `/dashboard/templates`
- `PATHS.DASHBOARD.TEMPLATES.NEW` → `/dashboard/templates/new`
- `PATHS.DASHBOARD.TEMPLATES.EDIT(id)` → `/dashboard/templates/{id}`
- `PATHS.DASHBOARD.DOWNLOAD_GATES.ROOT` → `/dashboard/download-gates`
- `PATHS.DASHBOARD.DOWNLOAD_GATES.NEW` → `/dashboard/download-gates/new`
- `PATHS.DASHBOARD.DOWNLOAD_GATES.DETAILS(id)` → `/dashboard/download-gates/{id}`

### Admin
- `PATHS.ADMIN.ROOT` → `/admin`

### Public Gates
- `PATHS.GATE.VIEW(slug)` → `/gate/{slug}`

### Stats
- `PATHS.STATS` → `/stats`

### API Routes

All API routes are also defined under `PATHS.API.*` for reference:

```tsx
import { PATHS } from '@/lib/paths';

// Examples
PATHS.API.CONTACTS.ROOT → '/api/contacts'
PATHS.API.DOWNLOAD_GATES.DETAILS(id) → '/api/download-gates/{id}'
PATHS.API.GATE.SUBMIT(slug) → '/api/gate/{slug}/submit'
```

## Migration from Hardcoded Paths

### Before (❌ Don't do this)

```tsx
// Hardcoded strings - prone to typos and broken links
<Link href="/login">Login</Link>
<Link href="/dashboard/download-gates/new">Create</Link>
router.push('/dashboard?tab=growth');
```

### After (✅ Do this)

```tsx
import { PATHS, buildUrl } from '@/lib/paths';

<Link href={PATHS.LOGIN}>Login</Link>
<Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}>Create</Link>
router.push(buildUrl(PATHS.DASHBOARD.ROOT, { tab: 'growth' }));
```

## Adding New Routes

When you add a new route to the application:

1. **Add the path to `lib/paths.ts`**

```typescript
export const PATHS = {
  // ... existing paths

  NEW_FEATURE: {
    ROOT: '/new-feature',
    DETAILS: (id: string) => `/new-feature/${id}`,
  },

  // ... rest of paths
} as const;
```

2. **Use it in your components**

```tsx
import { PATHS } from '@/lib/paths';

<Link href={PATHS.NEW_FEATURE.ROOT}>New Feature</Link>
```

## Validation Script

Run the validation script to check which files still need to be updated:

```bash
bash scripts/update-paths.sh
```

This will show:
- ✅ Files that already use PATHS
- ❌ Files that still have hardcoded paths

## Best Practices

1. **Always use PATHS for internal navigation** - Never hardcode path strings
2. **Use `buildUrl()` for query parameters** - Ensures proper URL encoding
3. **Keep PATHS.ts organized** - Group related paths together
4. **Use TypeScript** - Let the compiler catch path errors
5. **Document new paths** - Add comments for complex path structures

## Examples from the Codebase

### Login Page
```tsx
// app/login/page.tsx
import { PATHS } from '@/lib/paths';

<Link href={PATHS.HOME}>Back to Home</Link>
// After login
router.push(PATHS.DASHBOARD.ROOT);
```

### Dashboard Navigation
```tsx
// app/dashboard/page.tsx
import { PATHS } from '@/lib/paths';

<Link href={PATHS.SETTINGS}>Settings</Link>
<Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.NEW}>Create Gate</Link>
```

### Dynamic Gate Details
```tsx
// components/dashboard/CompactGatesList.tsx
import { PATHS } from '@/lib/paths';

gates.map(gate => (
  <Link href={PATHS.DASHBOARD.DOWNLOAD_GATES.DETAILS(gate.id)}>
    {gate.name}
  </Link>
))
```

## Troubleshooting

### TypeScript Error: Property doesn't exist

If you get an error like `Property 'NEW_PATH' does not exist`, make sure:

1. You've added the path to `lib/paths.ts`
2. The TypeScript server has reloaded (restart IDE if needed)
3. You're importing from `@/lib/paths`

### Link not working

If a link doesn't navigate correctly:

1. Check that the path matches the actual route in `app/` directory
2. Verify the PATHS constant matches the filesystem structure
3. For dynamic routes, ensure you're passing the correct parameters

## Related Files

- `lib/paths.ts` - Main configuration file
- `scripts/update-paths.sh` - Validation script
- This README - Documentation

---

**Last Updated:** 2025-12-29
**Maintained By:** Development Team
**Questions?** Check the examples above or ask the team
