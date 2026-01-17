-- Add Spotify track saved tracking to download_submissions
-- Tracks whether user saved (liked) the track to their Spotify library

ALTER TABLE download_submissions
ADD COLUMN spotify_track_saved BOOLEAN DEFAULT false,
ADD COLUMN spotify_track_saved_at TIMESTAMP(6);

-- Add comment
COMMENT ON COLUMN download_submissions.spotify_track_saved IS 'Whether user saved (liked) the track to their Spotify library (Liked Songs). Updated after successful Spotify OAuth when track URL is configured in download gate.';
COMMENT ON COLUMN download_submissions.spotify_track_saved_at IS 'Timestamp when track was saved to Spotify library. NULL if not saved yet.';
