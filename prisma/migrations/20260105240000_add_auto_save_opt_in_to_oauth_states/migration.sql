-- Add auto_save_opt_in field to oauth_states table
-- This field stores whether the user opted into auto-saving future releases during Spotify OAuth

ALTER TABLE oauth_states ADD COLUMN auto_save_opt_in BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN oauth_states.auto_save_opt_in IS 'Whether user opted into auto-saving future releases from the artist';
