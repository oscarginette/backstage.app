#!/usr/bin/env node
/**
 * Check sender_email and sender_name values in database
 */

const { sql } = require('@vercel/postgres');

async function checkSenderEmail() {
  try {
    console.log('Checking sender_email for user ID 3...\n');

    const result = await sql`
      SELECT
        id,
        email,
        sender_email,
        sender_name,
        updated_at
      FROM users
      WHERE id = 3
    `;

    if (result.rows.length === 0) {
      console.log('❌ User ID 3 not found');
      process.exit(1);
    }

    const user = result.rows[0];

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Sender Email:', user.sender_email || '(not set)');
    console.log('   Sender Name:', user.sender_name || '(not set)');
    console.log('   Updated At:', user.updated_at);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSenderEmail();
