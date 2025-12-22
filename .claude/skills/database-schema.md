# Database Schema - Backstage

**Auto-updated:** 2025-12-22
**Database:** PostgreSQL (Vercel/Neon)
**Last sync:** 12/22/2025, 11:17:02 AM

---

## Quick Reference

Use this skill when you need to:
- Check exact table names before writing queries
- Verify column names and types
- Understand relationships between tables
- Follow project naming conventions
- Write database migrations

---

## 📊 Current Database Tables

### Core Tables

#### `users`
**Purpose:** Multi-tenant user accounts (admin/user roles)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | User ID |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | User email (case-insensitive) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(20) | DEFAULT 'user' | 'user' or 'admin' |
| `active` | BOOLEAN | DEFAULT true | Account status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email`

**Relationships:**
- One-to-many with `contacts` (via `user_id`)
- One-to-many with `email_templates` (via `user_id`)
- One-to-many with `email_logs` (via `user_id`)
- One-to-many with `email_campaigns` (via `user_id`)
- One-to-many with `consent_history` (via `user_id`)
- One-to-many with `soundcloud_tracks` (via `user_id`)
- One-to-one with `quota_tracking` (via `user_id`)

---

#### `sessions`
**Purpose:** NextAuth v5 session storage

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Session ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration |
| `session_token` | VARCHAR | UNIQUE NOT NULL | JWT token |

**Relationships:**
- Many-to-one with `users` (via `user_id`)

---

#### `quota_tracking`
**Purpose:** Daily email sending limits per user

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Quota ID |
| `user_id` | INTEGER | FOREIGN KEY, UNIQUE | References `users.id` |
| `emails_sent_today` | INTEGER | DEFAULT 0 | Emails sent today |
| `last_reset_date` | DATE | DEFAULT CURRENT_DATE | Last daily reset |
| `monthly_limit` | INTEGER | DEFAULT 1000 | Daily sending limit |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-one with `users` (via `user_id`)

**Business Rules:**
- Reset `emails_sent_today = 0` when `last_reset_date != CURRENT_DATE`
- Enforce limit before sending emails (check in SendTrackEmailUseCase)

---

### Contact Management

#### `contacts`
**Purpose:** Email contact list (subscribers)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Contact ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `email` | VARCHAR(255) | NOT NULL | Contact email |
| `name` | VARCHAR(255) | | Contact name |
| `subscribed` | BOOLEAN | DEFAULT true | Subscription status |
| `unsubscribe_token` | VARCHAR(64) | UNIQUE | Token for unsubscribe link |
| `metadata` | JSONB | | Custom metadata |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)
- INDEX on `email`
- UNIQUE on `unsubscribe_token`

**Relationships:**
- Many-to-one with `users` (via `user_id`)

---

#### `consent_history`
**Purpose:** GDPR audit trail for consent changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | History ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `contact_id` | INTEGER | FOREIGN KEY | References `contacts.id` |
| `action` | VARCHAR(50) | NOT NULL | 'subscribe', 'unsubscribe', 'resubscribe' |
| `timestamp` | TIMESTAMP | DEFAULT NOW() | Action timestamp |
| `source` | VARCHAR(100) | | 'email_link', 'api', 'admin' |
| `ip_address` | VARCHAR(45) | | IP address (IPv4/IPv6) |
| `user_agent` | TEXT | | Browser user agent |
| `metadata` | JSONB | | Additional data (reason, etc) |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)
- INDEX on `contact_id`
- INDEX on `timestamp`

**Relationships:**
- Many-to-one with `users` (via `user_id`)
- Many-to-one with `contacts` (via `contact_id`)

**GDPR Compliance:**
- ALWAYS log IP + timestamp for all consent changes
- Retain for 7 years (legal requirement)

---

### Email System

#### `email_templates`
**Purpose:** Reusable email templates (MJML/HTML)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Template ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `name` | VARCHAR(255) | NOT NULL | Template name |
| `subject` | VARCHAR(255) | NOT NULL | Email subject |
| `html_content` | TEXT | | HTML version |
| `mjml_content` | TEXT | | MJML source |
| `is_draft` | BOOLEAN | DEFAULT false | Draft status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)

**Relationships:**
- Many-to-one with `users` (via `user_id`)

---

#### `email_logs`
**Purpose:** Email sending history and delivery tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Log ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `recipient_email` | VARCHAR(255) | NOT NULL | Recipient email |
| `subject` | VARCHAR(255) | | Email subject |
| `status` | VARCHAR(50) | | 'sent', 'failed', 'bounced', 'delivered' |
| `provider_message_id` | VARCHAR(255) | | Resend/Brevo message ID |
| `error_message` | TEXT | | Error details if failed |
| `sent_at` | TIMESTAMP | DEFAULT NOW() | Send timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)
- INDEX on `recipient_email`
- INDEX on `sent_at`

**Relationships:**
- Many-to-one with `users` (via `user_id`)

---

#### `email_campaigns`
**Purpose:** Bulk email campaign tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Campaign ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `name` | VARCHAR(255) | NOT NULL | Campaign name |
| `subject` | VARCHAR(255) | | Email subject |
| `template_id` | INTEGER | FOREIGN KEY | References `email_templates.id` |
| `status` | VARCHAR(50) | | 'draft', 'scheduled', 'sending', 'sent' |
| `total_recipients` | INTEGER | DEFAULT 0 | Total contacts |
| `sent_count` | INTEGER | DEFAULT 0 | Emails sent |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `sent_at` | TIMESTAMP | | Send timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)

**Relationships:**
- Many-to-one with `users` (via `user_id`)
- Many-to-one with `email_templates` (via `template_id`)

---

#### `email_events`
**Purpose:** Email engagement tracking (opens, clicks, bounces)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Event ID |
| `email_log_id` | INTEGER | FOREIGN KEY | References `email_logs.id` |
| `event_type` | VARCHAR(50) | NOT NULL | 'opened', 'clicked', 'bounced', 'complained' |
| `timestamp` | TIMESTAMP | DEFAULT NOW() | Event timestamp |
| `metadata` | JSONB | | Event details (link clicked, etc) |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `email_log_id`
- INDEX on `event_type`

**Relationships:**
- Many-to-one with `email_logs` (via `email_log_id`)

---

### Music Platform Integration

#### `soundcloud_tracks`
**Purpose:** SoundCloud track metadata and monitoring

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Track ID |
| `user_id` | INTEGER | FOREIGN KEY | References `users.id` |
| `soundcloud_id` | VARCHAR(255) | UNIQUE | SoundCloud track ID |
| `title` | VARCHAR(255) | | Track title |
| `artist` | VARCHAR(255) | | Artist name |
| `permalink_url` | TEXT | | SoundCloud URL |
| `artwork_url` | TEXT | | Cover image URL |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (multi-tenant filter)
- UNIQUE on `soundcloud_id`

**Relationships:**
- Many-to-one with `users` (via `user_id`)

---

### System Tables

#### `execution_logs`
**Purpose:** Background job execution history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Log ID |
| `job_type` | VARCHAR(100) | | 'check_new_tracks', 'send_campaign', etc |
| `status` | VARCHAR(50) | | 'success', 'failed' |
| `message` | TEXT | | Execution message |
| `executed_at` | TIMESTAMP | DEFAULT NOW() | Execution timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `job_type`
- INDEX on `executed_at`

---

#### `app_config`
**Purpose:** Application configuration (key-value store)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(255) | PRIMARY KEY | Config key |
| `value` | TEXT | | Config value |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update |

**Examples:**
- `last_soundcloud_check`: ISO timestamp
- `feature_flags`: JSON string

---

### Analytics Views (Read-Only)

#### `campaign_stats`
**Purpose:** Materialized view for campaign analytics

**Note:** This is a VIEW, not a table. Do not INSERT/UPDATE directly.

---

#### `consent_stats`
**Purpose:** GDPR consent statistics

**Note:** This is a VIEW, not a table. Do not INSERT/UPDATE directly.

---

## 🎯 Naming Conventions

### Tables
- **Plural nouns**: `users`, `contacts`, `email_templates`
- **Snake_case**: `consent_history`, `quota_tracking`
- **Descriptive**: `email_campaigns` (not `campaigns`)

### Columns
- **Snake_case**: `user_id`, `created_at`, `last_reset_date`
- **Suffixes**:
  - `_id`: Foreign keys or primary keys
  - `_at`: Timestamps
  - `_count`: Counters
  - `_url`: URLs
  - `_token`: Security tokens
  - `_hash`: Hashed values (passwords)

### Foreign Keys
- **Pattern**: `{referenced_table_singular}_id`
- Examples: `user_id`, `contact_id`, `template_id`

### Timestamps
- **Always include**: `created_at`, `updated_at` on all core tables
- **Use TIMESTAMP**: Not DATE or DATETIME
- **Default**: `DEFAULT NOW()`

### Indexes
- **Always index**: Foreign keys (`user_id`, etc)
- **Multi-tenant filter**: Every table with `user_id` MUST have index
- **Search columns**: `email`, `name`, etc

---

## 🔒 Multi-Tenant Rules

### CRITICAL: Every Query MUST Filter by user_id

```sql
-- ✅ CORRECT
SELECT * FROM contacts WHERE user_id = ${userId} AND subscribed = true;

-- ❌ WRONG - Leaks data across tenants!
SELECT * FROM contacts WHERE subscribed = true;
```

### Tables Requiring user_id Filter

- ✅ `contacts`
- ✅ `email_templates`
- ✅ `email_logs`
- ✅ `email_campaigns`
- ✅ `consent_history`
- ✅ `soundcloud_tracks`
- ✅ `quota_tracking`

### Tables NOT Requiring user_id Filter

- ❌ `users` (user management)
- ❌ `sessions` (auth system)
- ❌ `execution_logs` (system logs)
- ❌ `app_config` (global config)

---

## 🛡️ Security Guidelines

### SQL Injection Prevention
**ALWAYS use parameterized queries:**

```typescript
// ✅ CORRECT - Parameterized
const result = await sql`
  SELECT * FROM contacts WHERE user_id = ${userId} AND email = ${email}
`;

// ❌ WRONG - SQL injection vulnerability!
const result = await sql`SELECT * FROM contacts WHERE email = '${email}'`;
```

### Password Storage
- **NEVER store plain text passwords**
- Use bcrypt with 10 rounds minimum
- Column name: `password_hash` (not `password`)

### Tokens
- Use `crypto.randomBytes(32).toString('hex')` for tokens (64 chars)
- Store in columns like: `unsubscribe_token`, `reset_token`

---

## 📝 Migration Patterns

### Adding a New Table

```sql
CREATE TABLE IF NOT EXISTS table_name (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
```

### Adding user_id to Existing Table

```sql
-- 1. Add column (nullable first)
ALTER TABLE existing_table ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 2. Backfill data (assign to admin or specific user)
UPDATE existing_table SET user_id = 1 WHERE user_id IS NULL;

-- 3. Make NOT NULL
ALTER TABLE existing_table ALTER COLUMN user_id SET NOT NULL;

-- 4. Create index
CREATE INDEX idx_existing_table_user_id ON existing_table(user_id);
```

---

## 🔄 Schema Update Protocol

**When you modify the database:**

1. **Update this file** immediately with changes
2. **Document the change** in git commit message
3. **Update relevant entities** in `domain/entities/`
4. **Update repository interfaces** in `domain/repositories/`
5. **Update repository implementations** in `infrastructure/database/repositories/`

**Example Update Log:**

```markdown
## Change Log

### 2025-12-22 - Multi-tenant Migration
- Added `users` table with role and active columns
- Added `sessions` table for NextAuth v5
- Added `quota_tracking` table for email limits
- Added `user_id` column to: contacts, email_templates, email_logs, email_campaigns, consent_history, soundcloud_tracks
- Created indexes on all `user_id` columns
```

---

## 📚 Quick Queries

### Check if table exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'your_table_name'
);
```

### List all tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Get table structure
```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;
```

### List all indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_table_name';
```

---

## 🎓 Clean Architecture Mapping

### Entity Files → Database Tables

| Entity File | Table Name | Repository Interface |
|-------------|------------|---------------------|
| `User.ts` | `users` | `IUserRepository.ts` |
| `QuotaTracking.ts` | `quota_tracking` | `IQuotaTrackingRepository.ts` |
| `Contact.ts` | `contacts` | `IContactRepository.ts` |
| `ConsentHistory.ts` | `consent_history` | `IConsentHistoryRepository.ts` |
| `EmailTemplate.ts` | `email_templates` | `IEmailTemplateRepository.ts` |
| `EmailCampaign.ts` | `email_campaigns` | `IEmailCampaignRepository.ts` |
| `MusicTrack.ts` | `soundcloud_tracks` | `IMusicTrackRepository.ts` |

---

**Last Updated:** 2025-12-22 by Claude Code
**Next Review:** After next schema change
**Maintained by:** Development Team
