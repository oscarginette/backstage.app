/**
 * Run Contact Lists Migration
 *
 * Executes the contact lists migration SQL file
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function runMigration() {
  console.log('🚀 Running contact lists migration...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'sql', 'migration-contact-lists.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify contact_lists table created
    console.log('🔍 Verifying contact_lists table...');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name
    `);

    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Verify columns in contact_lists
    console.log('\n🔍 Verifying contact_lists columns...');
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'contact_lists'
      ORDER BY ordinal_position
    `);

    console.log(`✅ Found ${columns.rows.length} columns in contact_lists:`);
    columns.rows.forEach((row: any) => console.log(`   - ${row.column_name} (${row.data_type})`));

    // Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const indexes = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('contact_lists', 'contact_list_members')
      ORDER BY indexname
    `);

    console.log(`✅ Found ${indexes.rows.length} indexes:`);
    indexes.rows.forEach((row: any) => console.log(`   - ${row.indexname}`));

    console.log('\n✅ Migration complete!\n');

    await pool.end();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
