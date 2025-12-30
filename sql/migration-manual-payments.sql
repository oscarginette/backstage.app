-- ============================================================
-- MANUAL PAYMENT TRACKING MIGRATION
-- Date: 2025-12-30
-- Description: Add columns to track manual payments and admin actions
-- ============================================================

-- Add payment tracking columns to invoices table
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_notes TEXT,
  ADD COLUMN IF NOT EXISTS manually_created BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method);
CREATE INDEX IF NOT EXISTS idx_invoices_manually_created ON invoices(manually_created);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by_user ON invoices(created_by_user_id);

-- Add comments for documentation
COMMENT ON COLUMN invoices.payment_method IS 'Payment method: bank_transfer, paypal, cash, crypto, other';
COMMENT ON COLUMN invoices.payment_reference IS 'Transaction ID, check number, or other reference';
COMMENT ON COLUMN invoices.payment_notes IS 'Admin notes about the payment';
COMMENT ON COLUMN invoices.manually_created IS 'True if invoice was created manually by admin (not from Stripe)';
COMMENT ON COLUMN invoices.created_by_user_id IS 'Admin user who created the manual payment';

-- Create view for payment history dashboard
CREATE OR REPLACE VIEW payment_history_overview AS
SELECT
  i.id,
  i.customer_id,
  u.email as customer_email,
  u.name as customer_name,
  i.amount_due,
  i.amount_paid,
  i.currency,
  i.status,
  i.paid,
  i.paid_at,
  i.payment_method,
  i.payment_reference,
  i.payment_notes,
  i.manually_created,
  i.created_by_user_id,
  admin.email as created_by_admin_email,
  admin.name as created_by_admin_name,
  i.billing_reason,
  i.subscription_id,
  i.created,
  i.period_start,
  i.period_end,
  i.description
FROM invoices i
LEFT JOIN users u ON i.customer_id = u.id
LEFT JOIN users admin ON i.created_by_user_id = admin.id
ORDER BY i.created DESC;

COMMENT ON VIEW payment_history_overview IS 'Denormalized view for payment history dashboard with user details';
