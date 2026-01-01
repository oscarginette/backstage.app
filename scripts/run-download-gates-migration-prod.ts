#!/usr/bin/env tsx
/**
 * Run download_gates migration on production database
 * Usage: POSTGRES_URL=xxx tsx scripts/run-download-gates-migration-prod.ts
 */

import { Client } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const client = new Client(process.env.POSTGRES_URL);
  
  try {
    await client.connect();
    console.log('📦 Connected to production database');
    console.log('🚀 Running download_gates migration...\n');
    
    const migrationPath = join(process.cwd(), 'sql', 'migration-download-gates.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the entire migration as one transaction
    await client.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
