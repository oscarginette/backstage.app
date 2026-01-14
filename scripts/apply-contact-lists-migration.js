#!/usr/bin/env node
/**
 * Apply Contact Lists Migration
 *
 * This script applies the contact_lists migration to the database.
 * Run with: node scripts/apply-contact-lists-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });

  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in environment');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking if contact_lists tables exist...');

    const checkResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name;
    `);

    const existingTables = checkResult.rows.map(r => r.table_name);
    console.log('   Existing tables:', existingTables.join(', ') || 'NONE');

    if (existingTables.length === 2) {
      console.log('✅ Both tables already exist - no migration needed');
      await pool.end();
      process.exit(0);
    }

    console.log('\n📝 Reading migration SQL...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '..', 'sql', 'migration-contact-lists.sql'),
      'utf8'
    );

    console.log('🚀 Applying migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration applied successfully!');

    // Verify tables were created
    const verifyResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name;
    `);

    const createdTables = verifyResult.rows.map(r => r.table_name);
    console.log('✅ Created tables:', createdTables.join(', '));

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
