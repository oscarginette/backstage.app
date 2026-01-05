/**
 * Check Contact Lists Tables
 *
 * Verifies if contact lists tables exist
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function checkTables() {
  console.log('🔍 Checking contact lists tables...\n');

  try {
    // Check tables exist
    console.log('📊 Tables:');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name
    `);

    tables.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));

    if (tables.rows.length === 0) {
      console.log('   ❌ No tables found!');
      await pool.end();
      process.exit(1);
    }

    // Check columns
    console.log('\n📋 Columns in contact_lists:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contact_lists'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach((row: any) => {
      console.log(`   - ${row.column_name} (${row.data_type}, ${row.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'})`);
    });

    // Check indexes
    console.log('\n🔑 Indexes:');
    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE tablename IN ('contact_lists', 'contact_list_members')
      ORDER BY indexname
    `);

    indexes.rows.forEach((row: any) => console.log(`   - ${row.indexname} on ${row.tablename}`));

    console.log('\n✅ All checks passed!\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Check failed:', error);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
