/**
 * Migration Script: Make email_campaigns fields nullable
 *
 * This script makes subject and html_content nullable in email_campaigns table
 * to support flexible draft saving.
 *
 * Run: node scripts/migrate-campaigns-nullable.js
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrate() {
  try {
    console.log('Starting migration: Make email_campaigns fields nullable...');

    // Make subject nullable
    console.log('Making subject nullable...');
    await sql`
      ALTER TABLE email_campaigns
      ALTER COLUMN subject DROP NOT NULL
    `;
    console.log('✓ subject is now nullable');

    // Make html_content nullable
    console.log('Making html_content nullable...');
    await sql`
      ALTER TABLE email_campaigns
      ALTER COLUMN html_content DROP NOT NULL
    `;
    console.log('✓ html_content is now nullable');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nDrafts can now be saved with empty subject/content.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
