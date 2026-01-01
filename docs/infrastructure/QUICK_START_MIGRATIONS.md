# Quick Start: Database Migrations

## ⚡ TL;DR

```bash
# Add/change database column
npm run db:migrate:dev --name add_my_column

# Deploy to production
npm run db:migrate:deploy

# Check everything is in sync
npm run db:validate
```

---

## 🎯 Common Tasks

### 1. Add a New Column

**Example:** Add `updated_at` to `soundcloud_tracks`

```bash
# 1. Edit prisma/schema.prisma
# Add this line to soundcloud_tracks model:
updated_at   DateTime? @default(now()) @db.Timestamp(6)

# 2. Create and apply migration
npm run db:migrate:dev --name add_updated_at_to_soundcloud_tracks

# 3. Prisma will:
#    - Create migration SQL file
#    - Apply to local database
#    - Regenerate TypeScript types

# 4. Test locally
npm run dev
# Your code can now use track.updated_at

# 5. Commit
git add prisma/
git commit -m "feat: add updated_at to soundcloud_tracks"
git push

# 6. Deploy to production
npm run db:migrate:deploy
```

### 2. Create a New Table

```bash
# 1. Add to prisma/schema.prisma
model my_new_table {
  id         Int       @id @default(autoincrement())
  user_id    Int
  created_at DateTime? @default(now()) @db.Timestamp(6)

  users users @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
}

# 2. Create migration
npm run db:migrate:dev --name create_my_new_table

# Done!
```

### 3. Rename a Column

```bash
# IMPORTANT: Use a custom migration for renames to avoid data loss

# 1. Edit prisma/schema.prisma
# Rename: old_name -> new_name

# 2. Create migration WITHOUT applying
npm run db:migrate:dev --name rename_column --create-only

# 3. Edit generated migration SQL
# Replace:
#   ALTER TABLE DROP COLUMN old_name;
#   ALTER TABLE ADD COLUMN new_name;
# With:
#   ALTER TABLE RENAME COLUMN old_name TO new_name;

# 4. Apply migration
npm run db:migrate:dev

# 5. Deploy
npm run db:migrate:deploy
```

### 4. Add an Index

```bash
# 1. Edit prisma/schema.prisma
model contacts {
  // ... existing fields

  @@index([email])  // Add this
}

# 2. Create migration
npm run db:migrate:dev --name add_index_contacts_email

# Done!
```

---

## 🚨 Before You Deploy

**Checklist:**
- [ ] Migration created: `prisma/migrations/` has new folder
- [ ] Tested locally: `npm run dev` works
- [ ] Committed migration: `git add prisma/ && git commit`
- [ ] Validation passes: `npm run db:validate` ✅

**Then deploy:**
```bash
npm run db:migrate:deploy
```

---

## 🔍 Troubleshooting

### "Drift detected" error

**Cause:** Production DB schema doesn't match your Prisma schema

**Fix:**
```bash
# Pull actual production schema
npm run db:pull

# Review changes
git diff prisma/schema.prisma

# Create migration to fix
npm run db:migrate:dev --name fix_drift

# Deploy
npm run db:migrate:deploy
```

### Migration failed

**Cause:** SQL error during migration

**Fix:**
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Fix the migration SQL
# Edit: prisma/migrations/<migration_name>/migration.sql

# Retry
npm run db:migrate:deploy
```

### Can't connect to database

**Check:**
1. `POSTGRES_URL` environment variable is set
2. Database is running
3. Credentials are correct

```bash
# Test connection
psql $POSTGRES_URL -c "SELECT 1"
```

---

## 📖 Full Documentation

For complete details, see: `docs/infrastructure/DATABASE_MIGRATION_SYSTEM.md`

---

## 🆘 Need Help?

1. Check migration status: `npm run db:migrate:status`
2. Validate schema: `npm run db:validate`
3. Read full docs: `docs/infrastructure/DATABASE_MIGRATION_SYSTEM.md`
