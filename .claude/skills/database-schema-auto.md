# Database Schema Auto-Sync

## 📊 Database Tables (Auto-generated)

**Last sync:** 2025-12-22T10:17:02.518Z
**Total tables:** 13

```
  - app_config
  - consent_history
  - contacts
  - email_campaigns
  - email_events
  - email_logs
  - email_templates
  - execution_logs
  - quota_tracking
  - sessions
  - soundcloud_tracks
  - user_settings
  - users
```

## 📋 Table Structures (Auto-generated)

### `app_config`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | 1 |
| `updated_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |

**Indexes:**
- `undefined`

---

### `consent_history`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('consent_history_id_seq'::regclass) |
| `contact_id` | integer | ✓ | - |
| `action` | character varying | ✗ | - |
| `timestamp` | timestamp with time zone | ✗ | now() |
| `source` | character varying | ✗ | - |
| `ip_address` | inet | ✓ | - |
| `user_agent` | text | ✓ | - |
| `metadata` | jsonb | ✓ | - |
| `created_at` | timestamp with time zone | ✓ | now() |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `contacts`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('contacts_id_seq'::regclass) |
| `email` | character varying | ✗ | - |
| `name` | character varying | ✓ | - |
| `source` | character varying | ✓ | 'hypedit'::character varying |
| `subscribed` | boolean | ✓ | true |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `unsubscribed_at` | timestamp without time zone | ✓ | - |
| `unsubscribe_token` | character varying | ✓ | - |
| `metadata` | jsonb | ✓ | - |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `email_campaigns`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✗ | gen_random_uuid() |
| `template_id` | uuid | ✓ | - |
| `track_id` | character varying | ✓ | - |
| `subject` | character varying | ✗ | - |
| `html_content` | text | ✗ | - |
| `status` | character varying | ✗ | 'draft'::character varying |
| `scheduled_at` | timestamp with time zone | ✓ | - |
| `sent_at` | timestamp with time zone | ✓ | - |
| `created_at` | timestamp with time zone | ✗ | now() |
| `updated_at` | timestamp with time zone | ✗ | now() |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `email_events`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('email_events_id_seq'::regclass) |
| `email_log_id` | integer | ✗ | - |
| `contact_id` | integer | ✗ | - |
| `track_id` | text | ✗ | - |
| `event_type` | text | ✗ | - |
| `event_data` | jsonb | ✓ | '{}'::jsonb |
| `resend_email_id` | text | ✓ | - |
| `created_at` | timestamp without time zone | ✓ | now() |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `email_logs`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('email_logs_id_seq'::regclass) |
| `contact_id` | integer | ✓ | - |
| `track_id` | character varying | ✓ | - |
| `sent_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `resend_email_id` | character varying | ✓ | - |
| `status` | character varying | ✓ | 'sent'::character varying |
| `error` | text | ✓ | - |
| `delivered_at` | timestamp without time zone | ✓ | - |
| `opened_at` | timestamp without time zone | ✓ | - |
| `clicked_at` | timestamp without time zone | ✓ | - |
| `open_count` | integer | ✓ | 0 |
| `click_count` | integer | ✓ | 0 |
| `clicked_urls` | jsonb | ✓ | '[]'::jsonb |
| `template_id` | uuid | ✓ | - |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `email_templates`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✗ | gen_random_uuid() |
| `name` | character varying | ✗ | - |
| `description` | text | ✓ | - |
| `mjml_content` | jsonb | ✗ | - |
| `html_snapshot` | text | ✗ | - |
| `is_default` | boolean | ✓ | false |
| `version` | integer | ✓ | 1 |
| `parent_template_id` | uuid | ✓ | - |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `deleted_at` | timestamp without time zone | ✓ | - |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `execution_logs`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('execution_logs_id_seq'::regclass) |
| `executed_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `new_tracks` | integer | ✓ | 0 |
| `emails_sent` | integer | ✓ | 0 |
| `duration_ms` | integer | ✓ | - |
| `error` | text | ✓ | - |
| `track_id` | character varying | ✓ | - |
| `track_title` | character varying | ✓ | - |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`

---

### `quota_tracking`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('quota_tracking_id_seq'::regclass) |
| `user_id` | integer | ✓ | - |
| `emails_sent_today` | integer | ✓ | 0 |
| `last_reset_date` | date | ✓ | CURRENT_DATE |
| `monthly_limit` | integer | ✓ | 1000 |
| `created_at` | timestamp without time zone | ✓ | now() |
| `updated_at` | timestamp without time zone | ✓ | now() |

**Indexes:**
- `undefined`
- `undefined`

---

### `sessions`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('sessions_id_seq'::regclass) |
| `user_id` | integer | ✗ | - |
| `session_token` | character varying | ✗ | - |
| `expires` | timestamp without time zone | ✗ | - |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `soundcloud_tracks`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('soundcloud_tracks_id_seq'::regclass) |
| `track_id` | character varying | ✗ | - |
| `title` | character varying | ✗ | - |
| `url` | character varying | ✗ | - |
| `published_at` | timestamp without time zone | ✗ | - |
| `cover_image` | character varying | ✓ | - |
| `description` | text | ✓ | - |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `user_id` | integer | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

### `user_settings`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('user_settings_id_seq'::regclass) |
| `user_id` | integer | ✗ | - |
| `brevo_api_key` | text | ✓ | - |
| `soundcloud_user_id` | character varying | ✓ | - |
| `sender_email` | character varying | ✓ | - |
| `sender_name` | character varying | ✓ | - |
| `default_greeting` | text | ✓ | 'Hey mate,'::text |
| `default_signature` | text | ✓ | 'Much love,'::text |
| `auto_send_enabled` | boolean | ✓ | false |
| `metadata` | jsonb | ✓ | '{}'::jsonb |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`

---

### `users`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ✗ | nextval('users_id_seq'::regclass) |
| `email` | character varying | ✗ | - |
| `password_hash` | character varying | ✗ | - |
| `name` | character varying | ✓ | - |
| `role` | character varying | ✗ | 'artist'::character varying |
| `subscription_plan` | character varying | ✗ | 'free'::character varying |
| `monthly_quota` | integer | ✗ | 1000 |
| `emails_sent_this_month` | integer | ✗ | 0 |
| `quota_reset_at` | timestamp without time zone | ✓ | (date_trunc('month'::text, CURRENT_TIMESTAMP) + '1 mon'::interval) |
| `active` | boolean | ✓ | true |
| `email_verified` | boolean | ✓ | false |
| `created_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |
| `last_login_at` | timestamp without time zone | ✓ | - |

**Indexes:**
- `undefined`
- `undefined`
- `undefined`
- `undefined`
- `undefined`

---

