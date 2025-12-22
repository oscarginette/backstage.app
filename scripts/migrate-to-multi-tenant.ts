/**
 * Migration script: Assign existing data to admin user
 *
 * This script:
 * 1. Creates default admin user if doesn't exist
 * 2. Migrates all NULL user_id records to admin user
 * 3. Creates quota_tracking table if needed
 * 4. Verifies migration success
 */

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateToMultiTenant() {
  console.log('🚀 Starting multi-tenant migration...\n');

  // Step 1: Create admin user
  console.log('Step 1: Creating admin user...');
  const adminEmail = 'admin@backstage-art.com';
  const adminPassword = 'admin123'; // Change this!

  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${adminEmail}
  `;

  let adminUserId: number;

  if (existingUser.rows.length > 0) {
    adminUserId = existingUser.rows[0].id;
    console.log(`✅ Admin user already exists (ID: ${adminUserId})`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const result = await sql`
      INSERT INTO users (email, password_hash, role, created_at)
      VALUES (${adminEmail}, ${hashedPassword}, 'admin', NOW())
      RETURNING id
    `;
    adminUserId = result.rows[0].id;
    console.log(`✅ Admin user created (ID: ${adminUserId})`);
  }

  // Step 2: Create quota_tracking table if it doesn't exist
  console.log('\nStep 2: Creating quota_tracking table...');
  await sql`
    CREATE TABLE IF NOT EXISTS quota_tracking (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      emails_sent_today INTEGER DEFAULT 0,
      last_reset_date DATE DEFAULT CURRENT_DATE,
      monthly_limit INTEGER DEFAULT 1000,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    )
  `;
  console.log('✅ Quota tracking table ready');

  // Step 3: Migrate contacts
  console.log('\nStep 3: Migrating contacts...');
  const contactsResult = await sql`
    UPDATE contacts
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${contactsResult.rowCount} contacts`);

  // Step 4: Migrate email_templates
  console.log('\nStep 4: Migrating email templates...');
  const templatesResult = await sql`
    UPDATE email_templates
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${templatesResult.rowCount} email templates`);

  // Step 5: Migrate email_logs
  console.log('\nStep 5: Migrating email logs...');
  const logsResult = await sql`
    UPDATE email_logs
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${logsResult.rowCount} email logs`);

  // Step 6: Migrate email_campaigns
  console.log('\nStep 6: Migrating email campaigns...');
  const campaignsResult = await sql`
    UPDATE email_campaigns
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${campaignsResult.rowCount} email campaigns`);

  // Step 7: Migrate consent_history
  console.log('\nStep 7: Migrating consent history...');
  const consentResult = await sql`
    UPDATE consent_history
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${consentResult.rowCount} consent history records`);

  // Step 8: Migrate soundcloud_tracks
  console.log('\nStep 8: Migrating soundcloud tracks...');
  const tracksResult = await sql`
    UPDATE soundcloud_tracks
    SET user_id = ${adminUserId}
    WHERE user_id IS NULL
  `;
  console.log(`✅ Migrated ${tracksResult.rowCount} soundcloud tracks`);

  // Step 9: Create quota tracking for admin
  console.log('\nStep 9: Creating quota tracking...');
  const existingQuota = await sql`
    SELECT id FROM quota_tracking WHERE user_id = ${adminUserId}
  `;

  if (existingQuota.rows.length === 0) {
    await sql`
      INSERT INTO quota_tracking (user_id, emails_sent_today, last_reset_date, monthly_limit)
      VALUES (${adminUserId}, 0, CURRENT_DATE, 1000)
    `;
    console.log('✅ Quota tracking created (limit: 1000/day)');
  } else {
    console.log('✅ Quota tracking already exists');
  }

  // Step 10: Verify migration
  console.log('\nStep 10: Verifying migration...');
  const nullCounts = await sql`
    SELECT
      (SELECT COUNT(*) FROM contacts WHERE user_id IS NULL) as contacts,
      (SELECT COUNT(*) FROM email_templates WHERE user_id IS NULL) as templates,
      (SELECT COUNT(*) FROM email_logs WHERE user_id IS NULL) as logs,
      (SELECT COUNT(*) FROM email_campaigns WHERE user_id IS NULL) as campaigns,
      (SELECT COUNT(*) FROM consent_history WHERE user_id IS NULL) as consent,
      (SELECT COUNT(*) FROM soundcloud_tracks WHERE user_id IS NULL) as tracks
  `;

  const counts = nullCounts.rows[0];
  const totalNull = Object.values(counts).reduce((sum: number, val) => sum + Number(val), 0);

  if (totalNull === 0) {
    console.log('✅ Migration successful! No NULL user_id records found.');
  } else {
    console.error('❌ Migration incomplete. NULL records found:');
    console.error(counts);
    process.exit(1);
  }

  console.log('\n✅ Multi-tenant migration completed successfully!');
  console.log(`\nAdmin credentials:\nEmail: ${adminEmail}\nPassword: ${adminPassword}\n`);
  console.log('⚠️  IMPORTANT: Change admin password after first login!\n');
}

migrateToMultiTenant()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
