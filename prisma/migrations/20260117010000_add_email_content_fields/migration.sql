-- Add email content fields to email_campaigns table
-- These fields allow storing the original email parts for editing/resending

ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS greeting TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000);

-- Add comment explaining the purpose
COMMENT ON COLUMN email_campaigns.greeting IS 'Email greeting text (e.g., "Hey mate,")';
COMMENT ON COLUMN email_campaigns.message IS 'Email body message text';
COMMENT ON COLUMN email_campaigns.signature IS 'Email signature text (e.g., "Much love,\nGee Beat")';
COMMENT ON COLUMN email_campaigns.cover_image_url IS 'URL to cover image for the email';
