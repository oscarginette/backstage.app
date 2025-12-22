# Migration Scripts

## migrate-to-multi-tenant.ts

This script migrates existing single-tenant data to the multi-tenant architecture.

### What it does

1. Creates a default admin user (`admin@backstage-art.com`) if it doesn't exist
2. Migrates all records with `NULL` user_id to the admin user across all tables:
   - contacts
   - contact_lists
   - templates
   - email_logs
   - email_campaigns
   - consent_history
   - webhook_logs
   - unsubscribe_reasons
3. Creates quota tracking record for the admin user (1000 emails/day limit)
4. Verifies migration success

### Prerequisites

1. Database schema must be updated with Phase 5 SQL migration first
2. Environment variables must be configured (`.env.local`):
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING`

### Running the migration

```bash
# Install dependencies (if not already installed)
npm install

# Run the migration
npm run migrate:multi-tenant
```

### Safety features

- **Idempotent**: Can be run multiple times safely
- **Checks existing data**: Won't duplicate admin user or quota records
- **Verification**: Validates migration success before completing
- **Error handling**: Exits with error code if migration fails

### Default admin credentials

```
Email: admin@backstage-art.com
Password: admin123
```

**IMPORTANT**: Change the admin password immediately after first login!

### Security notes

1. The default password is intentionally weak and must be changed
2. All password hashes use bcrypt with 10 salt rounds
3. The script logs admin credentials for initial setup only

### Troubleshooting

**Error: "Migration incomplete. NULL records found"**
- Some records still have NULL user_id
- Check database constraints and foreign keys
- Run the script again after fixing any data issues

**Error: "Connection failed"**
- Verify database credentials in `.env.local`
- Check network connectivity to database
- Ensure database is running and accessible

**Error: "Table does not exist"**
- Run the Phase 5 SQL migration first
- Verify all tables have the `user_id` column

### Rollback

To rollback the migration:

```sql
-- WARNING: This will make all records orphaned
UPDATE contacts SET user_id = NULL;
UPDATE contact_lists SET user_id = NULL;
UPDATE templates SET user_id = NULL;
UPDATE email_logs SET user_id = NULL;
UPDATE email_campaigns SET user_id = NULL;
UPDATE consent_history SET user_id = NULL;
UPDATE webhook_logs SET user_id = NULL;
UPDATE unsubscribe_reasons SET user_id = NULL;

-- Delete admin user (cascades to quota_tracking)
DELETE FROM users WHERE email = 'admin@backstage-art.com';
```

**Note**: Only rollback if necessary. Data integrity requires proper user_id values.
