/**
 * Test GET user settings
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function testGetSettings() {
  try {
    console.log('Testing GET user settings for info@geebeat.com...\n');

    // Get user
    const userResult = await sql`
      SELECT * FROM users WHERE email = 'info@geebeat.com'
    `;

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  SoundCloud ID: ${user.soundcloud_id}`);
    console.log(`  SoundCloud Permalink: ${user.soundcloud_permalink}`);
    console.log(`  Spotify ID: ${user.spotify_id}`);
    console.log(`  Instagram URL: ${user.instagram_url}`);
    console.log('');

    // Check if there are any NULL values that might cause issues
    const nullFields = [];
    Object.keys(user).forEach(key => {
      if (user[key] === null) {
        nullFields.push(key);
      }
    });

    if (nullFields.length > 0) {
      console.log('NULL fields:', nullFields.join(', '));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testGetSettings();
