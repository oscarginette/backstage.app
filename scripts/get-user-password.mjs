/**
 * Get user password hash from production database
 * Run with: node scripts/get-user-password.mjs
 */

import postgres from 'postgres';

const POSTGRES_URL = 'postgresql://neondb_owner:npg_2jWgwzHe4nZo@ep-wandering-river-ag3kh8ec-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function getUserHash() {
  const sql = postgres(POSTGRES_URL);

  try {
    const result = await sql`
      SELECT email, password_hash
      FROM users
      WHERE email = 'info@thebackstage.app'
      LIMIT 1
    `;

    if (result.length > 0) {
      console.log('\n✅ User found:');
      console.log('Email:', result[0].email);
      console.log('Password Hash:', result[0].password_hash);
      console.log('\n⚠️  Note: This is a bcrypt hash, not the actual password.');
      console.log('You need to reset the password to get a new one.\n');
    } else {
      console.log('\n❌ User not found: info@thebackstage.app\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

getUserHash();
