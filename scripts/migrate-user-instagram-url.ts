/**
 * Migration Script: Add Instagram URL to Users Table
 *
 * Adds instagram_url field to users table to store user's Instagram profile URL.
 * This URL will be used as default when creating download gates.
 *
 * Run with: npx tsx scripts/migrate-user-instagram-url.ts
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function migrateUserInstagramUrl() {
  console.log('🚀 Running user Instagram URL migration...\n');

  try {
    // Migration SQL
    const migrationSQL = `
      -- Add instagram_url field to users table
      DO $$
      BEGIN
        -- Add instagram_url column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = 'instagram_url'
        ) THEN
          ALTER TABLE users
          ADD COLUMN instagram_url VARCHAR(500);

          RAISE NOTICE 'Added instagram_url column to users';
        ELSE
          RAISE NOTICE 'Column instagram_url already exists in users';
        END IF;
      END $$;
    `;

    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify column was added
    console.log('🔍 Verifying users table column...');
    const usersColumn = await pool.query(`
      SELECT column_name, data_type, is_nullable, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'instagram_url';
    `);

    if (usersColumn.rows.length === 1) {
      const col = usersColumn.rows[0];
      console.log(`✅ Found instagram_url column in users table:`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Max length: ${col.character_maximum_length}`);
      console.log(`   - Nullable: ${col.is_nullable}`);
    } else {
      console.warn(`⚠️  Column not found`);
    }

    console.log('\n✅ Migration complete!\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
migrateUserInstagramUrl();
