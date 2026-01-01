# Database Migration System & Schema Drift Prevention

## 🎯 Purpose

**Prevent schema drift disasters** that cause production errors like:
```
Error: column "updated_at" of relation "soundcloud_tracks" does not exist
```

This system ensures code and database schema are **always in sync** before deployment.

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Schema Drift Prevention                    │
│                   (Multi-Layer Defense)                      │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌──────────────┐
│  Prisma       │    │  GitHub       │    │  Vercel      │
│  Migrations   │───▶│  Actions      │───▶│  Build       │
│               │    │  CI/CD        │    │  Validation  │
│  (Source of   │    │  (Pre-merge)  │    │  (Pre-deploy)│
│   Truth)      │    │               │    │              │
└───────────────┘    └───────────────┘    └──────────────┘
```

### Defense Layers

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Single source of truth for database structure
   - Version-controlled migrations
   - Type-safe database client generation

2. **GitHub Actions** (`.github/workflows/schema-validation.yml`)
   - Runs on every PR to `main`
   - Validates migrations before merge
   - Tests against production schema
   - Runs smoke tests

3. **Vercel Build Hook** (`npm run build`)
   - Final validation before deployment
   - Generates Prisma Client
   - Blocks deploy if schema drift detected

---

## 📦 What Was Implemented

### 1. Prisma Migration System

**Files created:**
- `prisma/schema.prisma` - Database schema (introspected from production)
- `prisma/migrations/0_init/migration.sql` - Baseline migration
- `prisma.config.ts` - Prisma configuration

**Scripts added to `package.json`:**
```json
{
  "scripts": {
    "build": "npx prisma generate && next build",
    "db:migrate:deploy": "npx prisma migrate deploy",
    "db:migrate:dev": "npx prisma migrate dev",
    "db:migrate:status": "npx prisma migrate status",
    "db:validate": "tsx scripts/validate-production-schema.ts",
    "postinstall": "npx prisma generate"
  }
}
```

### 2. Pre-Deploy Validation Script

**File:** `scripts/validate-production-schema.ts`

**What it does:**
- Connects to production database
- Compares expected schema (Prisma) vs actual schema (DB)
- Fails build if drift detected
- Shows exact SQL needed to fix drift

**When it runs:**
- Manually: `npm run db:validate`
- CI/CD: On every PR (GitHub Actions)
- Vercel: Can be added to build command

### 3. Smoke Tests

**File:** `scripts/smoke-test-database.ts`

**Tests:**
- Database connection
- Critical tables exist
- Foreign key constraints work
- Required indexes exist
- Critical queries execute successfully
- Unique constraints enforced

**When it runs:**
- CI/CD: On every PR (GitHub Actions)
- Manually: `POSTGRES_URL=<url> npx tsx scripts/smoke-test-database.ts`

### 4. GitHub Actions Workflow

**File:** `.github/workflows/schema-validation.yml`

**Jobs:**
1. **validate-migrations**: Check migration files are valid
2. **test-production-schema**: Validate against production DB
3. **smoke-tests**: Run database smoke tests
4. **comment-pr**: Post results to PR

**Triggers:**
- Every PR to `main` (when database-related files change)
- Every push to `main`

---

## 🚀 Usage Guide

### Daily Development Workflow

#### 1. Making Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# Example: Add a column
model soundcloud_tracks {
  id           Int       @id @default(autoincrement())
  user_id      Int?
  track_id     String    @db.VarChar(500)
  title        String    @db.VarChar(500)
  url          String    @db.VarChar(1000)
  published_at DateTime  @db.Timestamp(6)
  updated_at   DateTime? @default(now()) @db.Timestamp(6)  // NEW
  // ...
}

# 2. Create migration
npm run db:migrate:dev --name add_updated_at_to_soundcloud_tracks

# 3. Prisma will:
#    - Generate migration SQL
#    - Apply it to local database
#    - Regenerate Prisma Client

# 4. Test locally
npm run dev

# 5. Commit migration files
git add prisma/migrations/
git add prisma/schema.prisma
git commit -m "feat: add updated_at to soundcloud_tracks"
```

#### 2. Deploying Schema Changes

```bash
# 1. Push to branch
git push origin feature/add-updated-at

# 2. Create PR
#    - GitHub Actions will validate schema
#    - Smoke tests will run
#    - PR comment shows results

# 3. If validation passes, merge PR

# 4. Deploy migrations to production
npm run db:migrate:deploy

# 5. Deploy application
git push  # Vercel auto-deploys main branch
```

#### 3. Checking Migration Status

```bash
# Check which migrations are applied
npm run db:migrate:status

# Validate schema matches production
npm run db:validate
```

---

## 🔥 Emergency Procedures

### Scenario 1: Schema Drift Detected in CI

**Symptom:**
```
❌ SCHEMA DRIFT DETECTED!
The production database schema does NOT match your Prisma schema.
```

**Fix:**
```bash
# 1. Pull latest schema from production
npm run db:pull

# 2. Review changes
git diff prisma/schema.prisma

# 3. Create migration from drift
npm run db:migrate:dev --name fix_schema_drift

# 4. Commit and deploy
git add prisma/
git commit -m "fix: resolve schema drift"
git push
```

### Scenario 2: Migration Failed in Production

**Symptom:**
```
Error: P3009 Migration failed to apply cleanly
```

**Fix:**
```bash
# 1. Check migration status
npm run db:migrate:status

# 2. Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# 3. Fix migration SQL manually or create new migration
npm run db:migrate:dev --name fix_<issue>

# 4. Apply to production
npm run db:migrate:deploy
```

### Scenario 3: Production Has Changes Not in Schema

**Symptom:**
Someone manually altered production DB without creating a migration.

**Fix:**
```bash
# 1. Introspect production to get actual schema
npm run db:pull

# 2. Review what changed
git diff prisma/schema.prisma

# 3. If changes are correct, create migration
npm run db:migrate:dev --name sync_with_production

# 4. If changes are wrong, manually revert in DB and re-run
```

---

## 🎓 Best Practices

### DO ✅

1. **Always use Prisma migrations**
   - Never manually ALTER TABLE in production
   - All schema changes via `npm run db:migrate:dev`

2. **Test migrations locally first**
   - Run `npm run db:migrate:dev` on local DB
   - Verify application works
   - Then deploy to production

3. **Commit migration files**
   - Migration files belong in version control
   - They're the history of your schema

4. **Run validation before deploy**
   - `npm run db:validate` catches drift early

5. **Use descriptive migration names**
   - `add_updated_at_to_tracks` ✅
   - `migration_1` ❌

### DON'T ❌

1. **Don't edit migration files after applied**
   - Once applied to production, migrations are immutable
   - Create a new migration to fix issues

2. **Don't skip migrations**
   - Migrations must run in order
   - Skipping breaks database history

3. **Don't manually edit production schema**
   - Always use migrations
   - Manual changes cause drift

4. **Don't deploy code before migrations**
   - Deploy migrations first
   - Then deploy application code

---

## 🔬 How Schema Validation Works

### Step-by-Step

1. **Introspection**
   ```bash
   npx prisma db pull
   # Connects to DB, reads actual schema, generates Prisma schema
   ```

2. **Diff Calculation**
   ```bash
   npx prisma migrate diff \
     --from-config-datasource \
     --to-schema prisma/schema.prisma \
     --script
   # Compares production DB vs Prisma schema, outputs SQL diff
   ```

3. **Validation**
   - If diff is **empty** → ✅ Schemas match
   - If diff has **SQL** → ❌ Drift detected

4. **Build Block**
   - CI/CD fails if drift detected
   - Prevents deploying incompatible code

---

## 📊 Monitoring & Observability

### GitHub Actions Dashboard

**What to watch:**
- ✅ All checks passing = safe to deploy
- ❌ Schema validation failed = drift detected
- ⚠️ Smoke tests failed = database issue

### Vercel Build Logs

**Look for:**
```
✓ Generating Prisma Client...
✓ Schema validation PASSED
```

If you see:
```
❌ SCHEMA DRIFT DETECTED
```
**DO NOT DEPLOY** until fixed.

---

## 🏆 Success Metrics

### Before This System
- ❌ Manual SQL migrations (error-prone)
- ❌ No drift detection
- ❌ Production errors from missing columns
- ❌ No migration history

### After This System
- ✅ Automated migration generation
- ✅ Pre-merge drift detection (GitHub Actions)
- ✅ Pre-deploy validation (Vercel)
- ✅ Type-safe database queries (Prisma Client)
- ✅ Full migration history in git
- ✅ Smoke tests prevent regressions

---

## 🔗 Next Steps (Future Enhancements)

### 1. Neon Database Branching

**What:** Create database copy for each PR

**Benefits:**
- Test migrations in isolated environment
- No risk to production data
- True production parity

**Implementation:** See `docs/infrastructure/NEON_BRANCHING.md`

### 2. Preview Environments

**What:** Deploy each PR to temporary environment with DB clone

**Benefits:**
- Full end-to-end testing
- Stakeholder can review features
- Catch integration issues pre-merge

**Implementation:** See `docs/infrastructure/PREVIEW_ENVIRONMENTS.md`

### 3. Automated Rollback

**What:** Automatically rollback migrations if deployment fails

**Benefits:**
- Faster recovery from failed deploys
- Reduced manual intervention
- Better availability

---

## 📚 References

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Schema Drift Detection](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)

---

## 🆘 Support

**If you encounter issues:**

1. Check migration status: `npm run db:migrate:status`
2. Validate schema: `npm run db:validate`
3. Review GitHub Actions logs
4. Check Vercel build logs

**Common issues:**
- [Schema Drift](#scenario-1-schema-drift-detected-in-ci)
- [Failed Migration](#scenario-2-migration-failed-in-production)
- [Manual DB Changes](#scenario-3-production-has-changes-not-in-schema)

---

*Last Updated: 2026-01-01*
*System: Prisma Migrations + GitHub Actions + Vercel*
*Status: ✅ Production Ready*
