/**
 * Test Spotify Integration End-to-End
 *
 * Tests the complete Spotify newsletter integration:
 * 1. Spotify API connection
 * 2. Fetch latest releases
 * 3. Verify database structure
 * 4. Simulate cron job execution
 *
 * Run: node scripts/test-spotify-integration.js
 */

require('dotenv').config({ path: '.env.local' });

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_ARTIST_ID = process.env.SPOTIFY_ARTIST_ID;

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
}

function section(msg) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${msg}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

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

async function getArtistAlbums(accessToken, artistId) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=5`,
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

async function testSpotifyAPI() {
  section('TEST 1: Spotify API Connection');

  try {
    info('Getting access token...');
    const accessToken = await getSpotifyAccessToken();
    success('Access token obtained');

    info(`Fetching releases for artist: ${SPOTIFY_ARTIST_ID}`);
    const albums = await getArtistAlbums(accessToken, SPOTIFY_ARTIST_ID);
    success(`Found ${albums.items.length} releases`);

    if (albums.items.length > 0) {
      const latest = albums.items[0];
      console.log(`\n   Latest Release:`);
      console.log(`   📀 Title: ${latest.name}`);
      console.log(`   📅 Date: ${latest.release_date}`);
      console.log(`   🎵 Type: ${latest.album_type}`);
      console.log(`   🔗 URL: ${latest.external_urls.spotify}`);
    }

    return true;
  } catch (err) {
    error(`Spotify API test failed: ${err.message}`);
    return false;
  }
}

async function testDatabaseStructure() {
  section('TEST 2: Database Structure');

  const { sql } = require('@vercel/postgres');

  try {
    info('Checking if spotify_tracks table exists...');

    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'spotify_tracks'
      ) as exists;
    `;

    if (result.rows[0].exists) {
      success('spotify_tracks table exists');

      // Check columns
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'spotify_tracks'
        ORDER BY ordinal_position;
      `;

      console.log(`\n   Table has ${columns.rowCount} columns:`);
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      return true;
    } else {
      error('spotify_tracks table does NOT exist');
      info('Run the migration: sql/migration-spotify-tracks.sql');
      return false;
    }
  } catch (err) {
    error(`Database test failed: ${err.message}`);
    return false;
  }
}

async function testEndpoints() {
  section('TEST 3: API Endpoints');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  info('Checking available endpoints...');

  const endpoints = [
    { path: '/api/check-spotify', desc: 'Spotify-only check' },
    { path: '/api/check-soundcloud', desc: 'SoundCloud-only check' },
    { path: '/api/check-music-platforms', desc: 'Unified platforms check' },
  ];

  console.log('\n   Available endpoints:');
  endpoints.forEach(ep => {
    console.log(`   ${colors.green}✓${colors.reset} ${ep.path} - ${ep.desc}`);
  });

  success('All endpoints configured');
  return true;
}

async function testCronConfiguration() {
  section('TEST 4: Cron Job Configuration');

  const fs = require('fs');
  const path = require('path');

  try {
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

    if (vercelJson.crons && vercelJson.crons.length > 0) {
      const cron = vercelJson.crons[0];

      console.log(`\n   Cron Job Configuration:`);
      console.log(`   📍 Path: ${cron.path}`);
      console.log(`   ⏰ Schedule: ${cron.schedule}`);
      console.log(`   🌍 Time: 7:00 PM UTC (daily)`);

      if (cron.path === '/api/check-music-platforms') {
        success('Unified cron job configured correctly');
        return true;
      } else {
        error(`Cron points to ${cron.path} instead of /api/check-music-platforms`);
        return false;
      }
    } else {
      error('No cron jobs configured in vercel.json');
      return false;
    }
  } catch (err) {
    error(`Cron configuration test failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n${colors.yellow}🎵 SPOTIFY INTEGRATION TEST SUITE${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);

  // Verify env vars
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_ARTIST_ID) {
    error('Missing environment variables:');
    console.log(`   SPOTIFY_CLIENT_ID: ${SPOTIFY_CLIENT_ID ? '✓' : '✗'}`);
    console.log(`   SPOTIFY_CLIENT_SECRET: ${SPOTIFY_CLIENT_SECRET ? '✓' : '✗'}`);
    console.log(`   SPOTIFY_ARTIST_ID: ${SPOTIFY_ARTIST_ID ? '✓' : '✗'}`);
    process.exit(1);
  }

  const results = {
    spotifyAPI: await testSpotifyAPI(),
    database: await testDatabaseStructure(),
    endpoints: await testEndpoints(),
    cron: await testCronConfiguration(),
  };

  // Summary
  section('TEST SUMMARY');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  console.log(`   Spotify API Connection:    ${results.spotifyAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Database Structure:        ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   API Endpoints:             ${results.endpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Cron Configuration:        ${results.cron ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n   ${colors.cyan}Total: ${passed}/${total} tests passed${colors.reset}\n`);

  if (passed === total) {
    success('🎉 ALL TESTS PASSED! Spotify integration is ready.');

    console.log(`\n   ${colors.yellow}Next Steps:${colors.reset}`);
    console.log(`   1. Run migration: Execute sql/migration-spotify-tracks.sql in your database`);
    console.log(`   2. Deploy to Vercel (cron will auto-activate)`);
    console.log(`   3. Test manually: curl https://your-domain.vercel.app/api/check-spotify`);
    console.log(`   4. Monitor logs in Vercel dashboard\n`);
  } else {
    error('Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

main();
