-- Add comment_text field to oauth_states table
-- Stores pre-written comment text for SoundCloud OAuth flow (Hypeddit-style)
-- User writes comment BEFORE OAuth, posted AFTER successful authentication
-- Auto-cleaned with state expiration (15 minutes)

ALTER TABLE "oauth_states"
ADD COLUMN "comment_text" TEXT;

-- Comment for documentation
COMMENT ON COLUMN "oauth_states"."comment_text" IS 'Pre-written comment text for SoundCloud OAuth flow (Hypeddit-style). Stores user comment before OAuth, posted after successful authentication. Auto-cleaned with state expiration (15 minutes).';
