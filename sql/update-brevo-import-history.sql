-- Migration: Add preview_used column to brevo_import_history table
-- Purpose: Track whether user previewed data before import (GDPR audit trail)
-- Date: 2025-12-24

ALTER TABLE brevo_import_history
ADD COLUMN IF NOT EXISTS preview_used BOOLEAN DEFAULT false;

COMMENT ON COLUMN brevo_import_history.preview_used IS
  'Whether user previewed data before import (audit trail for GDPR compliance)';

-- Backfill existing records: assume old imports did not use preview
UPDATE brevo_import_history
SET preview_used = false
WHERE preview_used IS NULL;
