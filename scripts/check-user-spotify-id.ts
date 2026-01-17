/**
 * Check User Spotify ID
 *
 * Verifies if the current user has spotify_id configured.
 * This is required for the follow artist feature to work.
 */

import { sql } from '@vercel/postgres';

async function checkUserSpotifyId() {
  try {
    console.log('Checking user Spotify ID configuration...\n');

    // Get all users with their Spotify ID
    const { rows } = await sql`
      SELECT
        id,
        email,
        spotify_id,
        created_at
      FROM users
      ORDER BY id ASC
    `;

    if (rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('📊 Users in database:\n');

    rows.forEach((user) => {
      const hasSpotifyId = !!user.spotify_id;
      const status = hasSpotifyId ? '✅' : '❌';

      console.log(`${status} User #${user.id}: ${user.email}`);
      console.log(`   Spotify ID: ${user.spotify_id || '(not set)'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}\n`);
    });

    // Summary
    const withSpotifyId = rows.filter(u => u.spotify_id).length;
    const withoutSpotifyId = rows.filter(u => !u.spotify_id).length;

    console.log('─'.repeat(50));
    console.log(`\n📈 Summary:`);
    console.log(`   Total users: ${rows.length}`);
    console.log(`   ✅ With Spotify ID: ${withSpotifyId}`);
    console.log(`   ❌ Without Spotify ID: ${withoutSpotifyId}\n`);

    if (withoutSpotifyId > 0) {
      console.log('⚠️  Users without Spotify ID will NOT be able to:');
      console.log('   - Auto-follow artist when fans connect Spotify');
      console.log('   - Use auto-save subscriptions for future releases');
      console.log('\n💡 To fix: Add spotify_id to users table:');
      console.log('   UPDATE users SET spotify_id = \'YOUR_SPOTIFY_ID\' WHERE id = X;\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserSpotifyId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
