-- Migration: Make email_campaigns.subject and email_campaigns.html_content nullable
-- Reason: Allow flexible drafts that can be saved with empty/partial content
-- Date: 2026-01-14

-- Make subject nullable (allow drafts without subject)
ALTER TABLE email_campaigns
ALTER COLUMN subject DROP NOT NULL;

-- Make html_content nullable (allow drafts without content)
ALTER TABLE email_campaigns
ALTER COLUMN html_content DROP NOT NULL;

-- Note: Validation should still enforce these fields for status='sent' campaigns
-- This is handled in the application layer (CreateCampaignUseCase)
