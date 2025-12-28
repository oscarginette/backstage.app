-- =====================================================
-- SPOTIFY TRACKS MIGRATION
-- Date: 2025-12-28
-- Purpose: Add Spotify tracks table for newsletter system
-- =====================================================

-- Create spotify_tracks table (mirrors soundcloud_tracks structure)
CREATE TABLE IF NOT EXISTS spotify_tracks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  track_id VARCHAR(500) NOT NULL,           -- Spotify track/album ID
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,               -- Spotify URL
  published_at TIMESTAMP NOT NULL,          -- Release date
  cover_image VARCHAR(1000),                -- Album artwork URL
  description TEXT,                         -- Track/album description
  album_type VARCHAR(50),                   -- 'album', 'single', 'compilation'
  total_tracks INTEGER,                     -- Number of tracks in release
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, track_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spotify_tracks_track_id ON spotify_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_spotify_tracks_user_id ON spotify_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_tracks_published_at ON spotify_tracks(published_at DESC);

-- Comments for documentation
COMMENT ON TABLE spotify_tracks IS 'Stores Spotify releases for newsletter tracking (albums, singles, EPs)';
COMMENT ON COLUMN spotify_tracks.track_id IS 'Spotify album/track ID (not URI, just the ID part)';
COMMENT ON COLUMN spotify_tracks.album_type IS 'Type of release: album, single, compilation';
COMMENT ON COLUMN spotify_tracks.total_tracks IS 'Number of tracks in the release';

-- Verify migration
SELECT 'spotify_tracks table created successfully' AS status;
