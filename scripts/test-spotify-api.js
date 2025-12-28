/**
 * Test Spotify API Connection
 *
 * Quick script to verify Spotify credentials and fetch artist data.
 * Run: node scripts/test-spotify-api.js
 */

require('dotenv').config({ path: '.env.local' });

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_ARTIST_ID = process.env.SPOTIFY_ARTIST_ID;

async function getSpotifyAccessToken() {
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function getArtistInfo(accessToken, artistId) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get artist info: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function getArtistAlbums(accessToken, artistId) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get albums: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log('🎵 Testing Spotify API Connection...\n');

  // Verify env vars
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_ARTIST_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('SPOTIFY_CLIENT_ID:', SPOTIFY_CLIENT_ID ? '✓' : '✗');
    console.error('SPOTIFY_CLIENT_SECRET:', SPOTIFY_CLIENT_SECRET ? '✓' : '✗');
    console.error('SPOTIFY_ARTIST_ID:', SPOTIFY_ARTIST_ID ? '✓' : '✗');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded\n');

  try {
    // Step 1: Get access token
    console.log('🔑 Getting access token...');
    const accessToken = await getSpotifyAccessToken();
    console.log('✅ Access token obtained\n');

    // Step 2: Get artist info
    console.log('👤 Fetching artist info...');
    const artist = await getArtistInfo(accessToken, SPOTIFY_ARTIST_ID);
    console.log('✅ Artist found:');
    console.log(`   Name: ${artist.name}`);
    console.log(`   Followers: ${artist.followers.total.toLocaleString()}`);
    console.log(`   Genres: ${artist.genres.join(', ') || 'N/A'}`);
    console.log(`   Popularity: ${artist.popularity}/100`);
    console.log(`   Profile: ${artist.external_urls.spotify}\n`);

    // Step 3: Get recent releases
    console.log('💿 Fetching recent releases...');
    const albums = await getArtistAlbums(accessToken, SPOTIFY_ARTIST_ID);
    console.log(`✅ Found ${albums.items.length} releases:\n`);

    albums.items.forEach((album, index) => {
      const releaseDate = new Date(album.release_date);
      console.log(`${index + 1}. ${album.name}`);
      console.log(`   Type: ${album.album_type}`);
      console.log(`   Released: ${releaseDate.toLocaleDateString()}`);
      console.log(`   Tracks: ${album.total_tracks}`);
      console.log(`   URL: ${album.external_urls.spotify}\n`);
    });

    // Latest release
    if (albums.items.length > 0) {
      const latest = albums.items[0];
      console.log('🎉 LATEST RELEASE:');
      console.log(`   "${latest.name}"`);
      console.log(`   Released: ${latest.release_date}`);
      console.log(`   ${latest.external_urls.spotify}\n`);
    }

    console.log('✅ Spotify API connection successful! 🎉');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
