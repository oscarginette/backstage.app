/**
 * Migration: Add sender_email and sender_name fields to users table
 *
 * Purpose: Allow artists to configure their custom "From" email address
 * for newsletters (e.g., "Artist Name <info@geebeat.com>")
 *
 * Fields:
 * - sender_email: Email address to send FROM (e.g., "info@geebeat.com")
 * - sender_name: Display name for sender (e.g., "Artist Name")
 *
 * Requirements:
 * - Domain must be verified in Mailgun/sending_domains table
 * - Falls back to default thebackstage.app if not configured
 *
 * Usage:
 *   node scripts/add-sender-email-fields.js
 */

const { sql } = require('@vercel/postgres');

async function addSenderEmailFields() {
  console.log('[Migration] START - Adding sender_email and sender_name fields');

  try {
    // 1. Add sender_email column (nullable)
    console.log('[Migration] Adding sender_email column...');
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255);
    `;
    console.log('[Migration] ✓ sender_email column added');

    // 2. Add sender_name column (nullable)
    console.log('[Migration] Adding sender_name column...');
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
    `;
    console.log('[Migration] ✓ sender_name column added');

    // 3. Create index for sender_email (for fast lookups)
    console.log('[Migration] Creating index on sender_email...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_sender_email
      ON users(sender_email)
      WHERE sender_email IS NOT NULL;
    `;
    console.log('[Migration] ✓ Index created on sender_email');

    console.log('[Migration] SUCCESS - Migration completed successfully');
    console.log('\nNext steps:');
    console.log('1. Users can configure sender email in /settings');
    console.log('2. Domain must be verified in /settings/sending-domains');
    console.log('3. Emails will automatically use custom sender if configured');

  } catch (error) {
    console.error('[Migration] ERROR:', {
      errorType: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}

// Run migration
addSenderEmailFields()
  .then(() => {
    console.log('[Migration] Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] Script execution failed:', error);
    process.exit(1);
  });
