#!/bin/bash

# Script to fix download gate critical issues
# Date: 2026-01-17

set -e

echo "🔧 Fixing Download Gate Critical Issues..."
echo ""

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: POSTGRES_URL environment variable not set"
  echo "Please set it first:"
  echo "  export POSTGRES_URL='your-postgres-connection-string'"
  exit 1
fi

echo "Step 1/2: Disabling email verification requirement..."
psql "$POSTGRES_URL" <<'SQL'
-- Disable email requirement for existing gates
UPDATE download_gates
SET require_email = false
WHERE require_email = true;

-- Change default for new gates
ALTER TABLE download_gates
ALTER COLUMN require_email SET DEFAULT false;

-- Verify
SELECT
  id,
  slug,
  require_email,
  require_instagram_follow,
  require_spotify_connect
FROM download_gates
WHERE active = true;
SQL

echo "✅ Email verification requirement disabled"
echo ""

echo "Step 2/2: Configure artist Spotify ID..."
echo ""
echo "🔍 Finding artist Spotify ID instructions:"
echo ""
echo "1. Go to your Spotify artist profile"
echo "2. Copy the ID from the URL"
echo "   Example: https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4"
echo "   → Artist ID is: 3TVXtAsR1Inumwj472S9r4"
echo ""
echo "3. Set the ARTIST_SPOTIFY_ID environment variable:"
echo "   export ARTIST_SPOTIFY_ID='your-actual-spotify-artist-id'"
echo ""

# Check if ARTIST_SPOTIFY_ID is set
if [ -z "$ARTIST_SPOTIFY_ID" ]; then
  echo "⚠️  ARTIST_SPOTIFY_ID not set. Skipping this step."
  echo ""
  echo "To complete setup, run:"
  echo "  export ARTIST_SPOTIFY_ID='your-id'"
  echo "  psql \$POSTGRES_URL -c \"UPDATE users SET spotify_id = '\$ARTIST_SPOTIFY_ID' WHERE id = 8;\""
else
  echo "Setting Spotify ID for artist (user ID 8)..."
  psql "$POSTGRES_URL" <<SQL
UPDATE users
SET spotify_id = '$ARTIST_SPOTIFY_ID'
WHERE id = 8;

-- Verify
SELECT id, email, spotify_id, soundcloud_id FROM users WHERE id = 8;
SQL
  echo "✅ Artist Spotify ID configured"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Wait for Vercel deployment to finish (~2 min)"
echo "2. Test the download gate flow end-to-end"
echo "3. Check Vercel logs to verify Spotify follow/save actions"
