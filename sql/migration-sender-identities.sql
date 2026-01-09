-- ============================================================================
-- SENDER IDENTITIES MIGRATION
-- ============================================================================
-- Purpose: Multi-provider email sender management with custom domain support
--
-- Migration Path:
-- Phase 1: Subdomain per user (username.mail.thebackstage.app)
-- Phase 2: Custom domain per user (newsletter@djdomain.com)
--
-- Supports: Resend, SendGrid, custom SMTP
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE sender_type AS ENUM ('subdomain', 'custom_domain', 'shared');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sender_provider AS ENUM ('resend', 'sendgrid', 'smtp');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE domain_auth_status AS ENUM ('pending', 'verified', 'failed', 'none');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. CREATE TABLE: sender_identities
-- ============================================================================

CREATE TABLE IF NOT EXISTS sender_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Identity type
  sender_type sender_type NOT NULL DEFAULT 'subdomain',
  provider sender_provider NOT NULL DEFAULT 'resend',

  -- Email configuration
  from_email VARCHAR(255) NOT NULL,           -- Full email address
  from_name VARCHAR(255) NOT NULL,            -- Display name
  reply_to_email VARCHAR(255),                -- Optional reply-to

  -- Domain information
  domain VARCHAR(255) NOT NULL,               -- Full domain
  subdomain VARCHAR(100),                     -- Subdomain part (for custom domains)

  -- Authentication status
  auth_status domain_auth_status NOT NULL DEFAULT 'none',
  spf_verified BOOLEAN NOT NULL DEFAULT FALSE,
  dkim_verified BOOLEAN NOT NULL DEFAULT FALSE,
  dmarc_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- DNS records (JSON - for custom domain verification)
  dns_records JSONB,
  -- Example:
  -- {
  --   "spf": "v=spf1 include:sendgrid.net ~all",
  --   "dkim": "k=rsa; p=MIGfMA0GCSqGSIb3...",
  --   "dmarc": "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
  -- }

  -- Provider-specific configuration (JSON)
  provider_config JSONB,
  -- Example for SendGrid:
  -- {
  --   "sendgridDomainId": 12345,
  --   "sendgridSubuserId": 67890
  -- }
  -- Example for SMTP:
  -- {
  --   "smtpHost": "smtp.example.com",
  --   "smtpPort": 587
  -- }

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,  -- User's default sender

  -- Timestamps
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_from_email
    CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sender_identities_user_id
  ON sender_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_sender_identities_domain
  ON sender_identities(domain);

CREATE INDEX IF NOT EXISTS idx_sender_identities_from_email
  ON sender_identities(from_email);

CREATE INDEX IF NOT EXISTS idx_sender_identities_active
  ON sender_identities(is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sender_identities_primary
  ON sender_identities(user_id, is_primary)
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_sender_identities_type
  ON sender_identities(sender_type);

CREATE INDEX IF NOT EXISTS idx_sender_identities_provider
  ON sender_identities(provider);

-- Unique constraint: Only one primary sender per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_sender_identities_unique_user_primary
  ON sender_identities(user_id)
  WHERE is_primary = TRUE;

-- ============================================================================
-- 4. CREATE TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sender_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sender_identities_updated_at
  ON sender_identities;

CREATE TRIGGER trigger_update_sender_identities_updated_at
  BEFORE UPDATE ON sender_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_sender_identities_updated_at();

-- ============================================================================
-- 5. CREATE VIEW: Active sender identities with user info
-- ============================================================================

CREATE OR REPLACE VIEW v_active_sender_identities AS
SELECT
  si.id,
  si.user_id,
  u.email AS user_email,
  u.name AS user_name,
  si.sender_type,
  si.provider,
  si.from_email,
  si.from_name,
  si.reply_to_email,
  si.domain,
  si.subdomain,
  si.auth_status,
  si.spf_verified,
  si.dkim_verified,
  si.dmarc_verified,
  si.is_primary,
  si.verified_at,
  si.created_at
FROM sender_identities si
JOIN users u ON u.id = si.user_id
WHERE si.is_active = TRUE
ORDER BY si.user_id, si.is_primary DESC, si.created_at DESC;

-- ============================================================================
-- 6. COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE sender_identities IS
  'Email sender identities for multi-tenant email sending. Supports subdomain (Phase 1) and custom domain (Phase 2) sending.';

COMMENT ON COLUMN sender_identities.sender_type IS
  'Type of sender: subdomain (managed), custom_domain (user DNS), or shared (legacy)';

COMMENT ON COLUMN sender_identities.provider IS
  'Email provider: resend, sendgrid, or smtp (custom)';

COMMENT ON COLUMN sender_identities.from_email IS
  'Full FROM email address used for sending (e.g., newsletter@technoking.mail.thebackstage.app)';

COMMENT ON COLUMN sender_identities.domain IS
  'Full domain for this sender (e.g., technoking.mail.thebackstage.app or djdomain.com)';

COMMENT ON COLUMN sender_identities.auth_status IS
  'Domain authentication status: pending (awaiting DNS), verified (ready), failed (DNS error), none (subdomain/no auth needed)';

COMMENT ON COLUMN sender_identities.dns_records IS
  'DNS records for custom domain verification (SPF, DKIM, DMARC). NULL for subdomains.';

COMMENT ON COLUMN sender_identities.provider_config IS
  'Provider-specific configuration (e.g., SendGrid domain ID, SMTP credentials)';

COMMENT ON COLUMN sender_identities.is_primary IS
  'Whether this is the user''s primary/default sender identity. Only one per user.';

-- ============================================================================
-- 7. SEED DATA: Create subdomain identities for existing users
-- ============================================================================

-- This will run ONLY if sender_identities is empty
DO $$
DECLARE
  user_record RECORD;
  subdomain_email TEXT;
  subdomain_domain TEXT;
BEGIN
  -- Check if sender_identities is empty
  IF NOT EXISTS (SELECT 1 FROM sender_identities LIMIT 1) THEN

    -- For each user, create a subdomain sender identity
    FOR user_record IN
      SELECT id, email, name
      FROM users
    LOOP
      -- Generate subdomain from user ID (fallback if no username)
      subdomain_domain := 'u' || user_record.id || '.mail.thebackstage.app';
      subdomain_email := 'newsletter@' || subdomain_domain;

      -- Insert sender identity
      INSERT INTO sender_identities (
        user_id,
        sender_type,
        provider,
        from_email,
        from_name,
        reply_to_email,
        domain,
        auth_status,
        spf_verified,
        dkim_verified,
        dmarc_verified,
        is_active,
        is_primary,
        verified_at
      ) VALUES (
        user_record.id,
        'subdomain',
        'resend',  -- Current provider
        subdomain_email,
        user_record.name,
        user_record.email,  -- Reply-to their personal email
        subdomain_domain,
        'verified',  -- Subdomain is auto-verified
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        NOW()
      );

      RAISE NOTICE 'Created sender identity for user % (%)', user_record.id, subdomain_email;
    END LOOP;

    RAISE NOTICE 'Sender identities seeded for % users', (SELECT COUNT(*) FROM users);
  ELSE
    RAISE NOTICE 'Sender identities already exist. Skipping seed.';
  END IF;
END $$;

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== SENDER IDENTITIES MIGRATION COMPLETE ===';
  RAISE NOTICE 'Tables created: %', (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_name = 'sender_identities'
  );
  RAISE NOTICE 'Sender identities: %', (SELECT COUNT(*) FROM sender_identities);
  RAISE NOTICE 'Active identities: %', (SELECT COUNT(*) FROM v_active_sender_identities);
END $$;
