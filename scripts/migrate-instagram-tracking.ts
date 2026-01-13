/**
 * Migration Script: Add Instagram Tracking to Download Gates
 *
 * This script adds Instagram follow tracking capabilities to the download gates system.
 * Adds fields to download_gates and download_submissions tables.
 *
 * Run with: npx tsx scripts/migrate-instagram-tracking.ts
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function migrateInstagramTracking() {
  console.log('🚀 Running Instagram tracking migration...\n');

  try {
    // Migration SQL
    const migrationSQL = `
      -- Add Instagram fields to download_gates table
      DO $$
      BEGIN
        -- Add require_instagram_follow column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'download_gates'
          AND column_name = 'require_instagram_follow'
        ) THEN
          ALTER TABLE download_gates
          ADD COLUMN require_instagram_follow BOOLEAN DEFAULT false;

          RAISE NOTICE 'Added require_instagram_follow column to download_gates';
        ELSE
          RAISE NOTICE 'Column require_instagram_follow already exists in download_gates';
        END IF;

        -- Add instagram_profile_url column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'download_gates'
          AND column_name = 'instagram_profile_url'
        ) THEN
          ALTER TABLE download_gates
          ADD COLUMN instagram_profile_url VARCHAR(500);

          RAISE NOTICE 'Added instagram_profile_url column to download_gates';
        ELSE
          RAISE NOTICE 'Column instagram_profile_url already exists in download_gates';
        END IF;
      END $$;

      -- Add Instagram tracking fields to download_submissions table
      DO $$
      BEGIN
        -- Add instagram_click_tracked column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'download_submissions'
          AND column_name = 'instagram_click_tracked'
        ) THEN
          ALTER TABLE download_submissions
          ADD COLUMN instagram_click_tracked BOOLEAN DEFAULT false;

          RAISE NOTICE 'Added instagram_click_tracked column to download_submissions';
        ELSE
          RAISE NOTICE 'Column instagram_click_tracked already exists in download_submissions';
        END IF;

        -- Add instagram_click_tracked_at column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'download_submissions'
          AND column_name = 'instagram_click_tracked_at'
        ) THEN
          ALTER TABLE download_submissions
          ADD COLUMN instagram_click_tracked_at TIMESTAMP(6);

          RAISE NOTICE 'Added instagram_click_tracked_at column to download_submissions';
        ELSE
          RAISE NOTICE 'Column instagram_click_tracked_at already exists in download_submissions';
        END IF;
      END $$;
    `;

    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify columns were added
    console.log('🔍 Verifying download_gates columns...');
    const gatesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'download_gates'
      AND column_name IN ('require_instagram_follow', 'instagram_profile_url')
      ORDER BY column_name;
    `);

    if (gatesColumns.rows.length === 2) {
      console.log(`✅ Found ${gatesColumns.rows.length} Instagram columns in download_gates table:`);
      gatesColumns.rows.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.warn(`⚠️  Expected 2 columns, found ${gatesColumns.rows.length}`);
    }

    console.log('\n🔍 Verifying download_submissions columns...');
    const submissionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'download_submissions'
      AND column_name IN ('instagram_click_tracked', 'instagram_click_tracked_at')
      ORDER BY column_name;
    `);

    if (submissionsColumns.rows.length === 2) {
      console.log(`✅ Found ${submissionsColumns.rows.length} Instagram columns in download_submissions table:`);
      submissionsColumns.rows.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.warn(`⚠️  Expected 2 columns, found ${submissionsColumns.rows.length}`);
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
migrateInstagramTracking();
