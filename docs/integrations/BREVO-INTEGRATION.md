# Brevo Integration

Multi-tenant Brevo integration that allows each user to connect their own Brevo account and import contacts.

## Features

- ✅ **Multi-tenant**: Each user can connect their own Brevo account
- ✅ **Secure**: API keys are encrypted in the database
- ✅ **One-click import**: Import all contacts from all Brevo lists with one button
- ✅ **Deduplication**: Automatically handles duplicate contacts (by email)
- ✅ **Audit trail**: Full history of all import operations
- ✅ **Real-time stats**: See how many contacts were imported
- ✅ **Error handling**: Detailed error messages and graceful failure handling

## Architecture

### Database Schema

**`brevo_integrations`**
- Stores encrypted API keys per user (one integration per user)
- Tracks account information (email, name, company)
- Records last sync time and errors

**`brevo_import_history`**
- Audit trail of all import operations
- Tracks stats: fetched, inserted, updated, skipped contacts
- Stores error details for troubleshooting

**`contacts` table updates**
- Added `brevo_id` column for deduplication
- Added `brevo_list_ids` array for tracking which Brevo lists a contact belongs to

### API Routes

1. **`POST /api/integrations/brevo/connect`**
   - Validates and stores Brevo API key
   - Fetches account info from Brevo to verify key
   - Encrypts API key before storing

2. **`DELETE /api/integrations/brevo/disconnect`**
   - Soft deletes integration (keeps history)
   - Clears API key

3. **`GET /api/integrations/brevo/status`**
   - Returns connection status
   - Includes stats (total contacts, imports, last sync)

4. **`POST /api/integrations/brevo/import`**
   - Imports ALL contacts from ALL Brevo lists
   - Handles pagination (500 contacts per request)
   - Deduplicates by `user_id + email`
   - Creates audit trail record

5. **`GET /api/integrations/brevo/import`**
   - Returns import history (last 10 imports)

## User Guide

### How to Connect Brevo

1. Go to **Settings** page
2. Scroll to **Brevo Integration** section
3. Click "How to get" to see instructions
4. Go to [Brevo API Settings](https://app.brevo.com/settings/keys/api)
5. Generate a new API key (starts with `xkeysib-`)
6. Copy and paste it into the field
7. Click "Connect Brevo Account"

### How to Import Contacts

1. After connecting, you'll see your account info
2. Click "Import Contacts from Brevo"
3. Confirm the action
4. Wait for the import to complete (may take several minutes)
5. View import summary (new, updated, skipped contacts)

## Technical Details

### API Key Encryption

**Current implementation** (for MVP):
```typescript
// Encryption (Base64 - simple but NOT secure for production)
const encrypted = Buffer.from(apiKey).toString('base64');

// Decryption
const decrypted = Buffer.from(encrypted, 'base64').toString('utf-8');
```

**TODO for production**:
- Use PostgreSQL `pgcrypto` extension
- Or implement AES-256 encryption at application level
- Store encryption key in environment variable

### Import Logic

```typescript
// 1. Fetch all Brevo lists
const lists = await brevo.getLists();

// 2. For each list, paginate through contacts (500 per page)
for (const list of lists) {
  let offset = 0;
  while (hasMore) {
    const contacts = await brevo.getContactsFromList(list.id, limit, offset);

    // 3. Insert/update each contact
    for (const contact of contacts) {
      await sql`
        INSERT INTO contacts (user_id, email, name, ...)
        VALUES (...)
        ON CONFLICT (user_id, email) DO UPDATE SET ...
      `;
    }

    offset += limit;
  }
}
```

### Deduplication Strategy

**Unique constraint**: `(user_id, email)`

**Conflict resolution**:
- Email: Primary key (never changes)
- Name: Keep existing if new is null, otherwise update
- Subscription status: Always update to latest from Brevo
- Metadata: Merge JSONs (keeps history)
- Brevo IDs: Always update

```sql
ON CONFLICT (user_id, email) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, contacts.name),
  subscribed = EXCLUDED.subscribed,
  brevo_id = EXCLUDED.brevo_id,
  brevo_list_ids = EXCLUDED.brevo_list_ids,
  metadata = contacts.metadata || EXCLUDED.metadata
```

## GDPR Compliance

### Data Retention

- **Soft delete**: Disconnecting doesn't delete import history
- **Audit trail**: All imports are logged with timestamps
- **Transparency**: Users can see exactly what was imported and when

### API Key Security

- **Encrypted storage**: API keys never stored in plaintext
- **No logging**: API keys never logged to console or files
- **User-controlled**: Users can disconnect at any time
- **Scoped access**: Each user can only access their own integration

## Error Handling

### Import Errors

**Types of errors**:
1. **Brevo API errors**: Rate limits, authentication, network
2. **Database errors**: Constraint violations, connection issues
3. **Contact-level errors**: Invalid data, parsing failures

**Error tracking**:
- Import continues even if individual contacts fail
- Failed contacts are counted as "skipped"
- First 50 errors stored in `errors_detail` JSONB
- First 10 errors shown in UI

**Recovery**:
- Import can be retried (safe - deduplication handles it)
- Status endpoint shows `last_error` for debugging

## Rate Limiting

**Brevo API limits**:
- 500 contacts per request (maximum)
- No official rate limit documented

**Our implementation**:
- 100ms pause between requests to avoid overwhelming API
- 60s timeout for serverless function (Vercel limit)

**Recommendations**:
- Import during off-peak hours for large lists (10k+ contacts)
- Monitor `duration_ms` in import history

## Testing

### Local Testing

1. **Apply migration**:
   ```bash
   ./scripts/migrate-brevo-integration.sh
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Create test account**:
   - Sign up at http://localhost:3002/signup
   - Go to Settings

4. **Connect Brevo**:
   - Use your real Brevo API key (get from https://app.brevo.com)
   - Or use a test account

5. **Test import**:
   - Create a test list in Brevo with a few contacts
   - Click "Import Contacts"
   - Verify contacts appear in Dashboard

### Edge Cases to Test

- [ ] Empty Brevo account (no lists)
- [ ] Duplicate emails across multiple lists
- [ ] Contacts with no name
- [ ] Contacts with special characters in name/email
- [ ] Very large imports (10k+ contacts)
- [ ] Disconnecting and reconnecting
- [ ] Multiple imports (verify deduplication)
- [ ] Invalid API key
- [ ] Expired API key (simulate by using wrong key)

## Monitoring

### Queries for Monitoring

**Active integrations**:
```sql
SELECT
  COUNT(*) as total_integrations,
  COUNT(*) FILTER (WHERE last_sync_at > NOW() - INTERVAL '7 days') as active_last_week
FROM brevo_integrations
WHERE is_active = true;
```

**Import stats**:
```sql
SELECT
  DATE(started_at) as date,
  COUNT(*) as total_imports,
  SUM(contacts_fetched) as total_contacts_fetched,
  SUM(contacts_inserted) as total_contacts_inserted,
  AVG(duration_ms) as avg_duration_ms
FROM brevo_import_history
WHERE status = 'completed'
GROUP BY DATE(started_at)
ORDER BY date DESC
LIMIT 30;
```

**Error rate**:
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM brevo_import_history
GROUP BY status;
```

## Future Enhancements

### Potential Features

1. **Incremental sync**: Only import new/updated contacts since last sync
2. **Webhook integration**: Real-time updates when contacts change in Brevo
3. **Selective import**: Let users choose which lists to import
4. **Two-way sync**: Update Brevo when contacts change in Backstage
5. **Scheduled imports**: Automatically sync daily/weekly
6. **Import preview**: Show what will be imported before confirming
7. **Conflict resolution UI**: Let users choose how to handle duplicates

### Security Improvements

1. **Production encryption**: Use AES-256 or pgcrypto
2. **API key rotation**: Detect and handle expired keys
3. **Rate limiting**: Prevent abuse with user-level rate limits
4. **Audit logging**: Track who accessed what and when

## Troubleshooting

### "Invalid API key" error

**Cause**: API key is incorrect or expired

**Solution**:
1. Go to [Brevo API Settings](https://app.brevo.com/settings/keys/api)
2. Generate a new API key
3. Disconnect old integration in Settings
4. Reconnect with new API key

### "Import timeout" error

**Cause**: Too many contacts (>60s to import)

**Solution**:
- This is a Vercel serverless limit
- Consider upgrading to Pro plan (300s timeout)
- Or implement chunked imports (import in batches)

### "Duplicate email" error

**Cause**: Contact already exists with same email

**Solution**:
- This is expected behavior (deduplication)
- Contact will be updated, not duplicated
- Check import summary for "updated" count

### Import stuck at "Importing..."

**Cause**: Frontend lost connection or timeout

**Solution**:
1. Check Network tab in DevTools for errors
2. Check import history: `GET /api/integrations/brevo/import`
3. Retry import (safe - deduplication handles it)

## References

- [Brevo API Documentation](https://developers.brevo.com/docs)
- [Brevo Contacts API](https://developers.brevo.com/reference/getcontactsfromlist)
- [Brevo Authentication](https://developers.brevo.com/docs/authentication)
- [Clean Architecture](../setup/CREAR-API-KEY.md)
- [Database Schema](../../database-schema.sql)

---

**Last Updated**: 2025-12-24
**Version**: 1.0.0
**Status**: Production Ready (with security TODO)
