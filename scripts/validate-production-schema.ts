#!/usr/bin/env tsx
/**
 * Pre-Deploy Schema Validation Script
 *
 * This script prevents deployment when there's schema drift between:
 * - Expected schema (Prisma schema.prisma)
 * - Actual production database schema
 *
 * CRITICAL: This runs during Vercel builds to prevent deploying code
 * that expects database columns that don't exist in production.
 *
 * Architecture: Robust schema validation (prevents schema drift disasters)
 * - Connects to production database (read-only introspection)
 * - Compares expected vs actual schema
 * - Fails build if drift detected
 * - Shows clear migration instructions
 *
 * Usage:
 *   npm run db:validate                    # Validate against POSTGRES_URL
 *   POSTGRES_URL=<url> npm run db:validate # Validate specific database
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface ValidationResult {
  hasDrift: boolean;
  diffOutput: string;
  errorMessage?: string;
}

async function validateSchema(): Promise<ValidationResult> {
  const postgresUrl = process.env.POSTGRES_URL;

  if (!postgresUrl) {
    return {
      hasDrift: true,
      diffOutput: '',
      errorMessage: 'POSTGRES_URL environment variable is not set',
    };
  }

  console.log('🔍 Validating production database schema...');
  console.log(`📊 Database: ${postgresUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  try {
    // Run prisma migrate diff to compare schema
    const { stdout, stderr } = await execAsync(
      'npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script',
      {
        env: {
          ...process.env,
          POSTGRES_URL: postgresUrl,
        },
      }
    );

    // If diff produces SQL output, there's drift
    const hasDrift = stdout.trim().length > 0;

    if (hasDrift) {
      console.error('❌ SCHEMA DRIFT DETECTED!\n');
      console.error('The production database schema does NOT match your Prisma schema.');
      console.error('This means your code expects database columns/tables that don\'t exist.\n');
      console.error('📋 Required SQL changes:\n');
      console.error(stdout);
      console.error('\n⚠️  DEPLOYMENT BLOCKED\n');
      console.error('To fix this:');
      console.error('1. Review the SQL changes above');
      console.error('2. Create a migration: npm run db:migrate:dev --name <description>');
      console.error('3. Deploy migration to production: npm run db:migrate:deploy');
      console.error('4. Commit migration files to git');
      console.error('5. Re-deploy\n');

      return {
        hasDrift: true,
        diffOutput: stdout,
      };
    }

    console.log('✅ Schema validation PASSED');
    console.log('Production database matches Prisma schema.\n');

    return {
      hasDrift: false,
      diffOutput: '',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Schema validation FAILED');
    console.error(`Error: ${errorMsg}\n`);

    return {
      hasDrift: true,
      diffOutput: '',
      errorMessage: errorMsg,
    };
  }
}

async function checkMigrationStatus(): Promise<void> {
  console.log('🔄 Checking migration status...\n');

  try {
    const { stdout } = await execAsync('npx prisma migrate status', {
      env: process.env,
    });

    console.log(stdout);
  } catch (error) {
    console.error('⚠️  Migration status check failed');
    console.error(error instanceof Error ? error.message : String(error));
  }
}

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Production Schema Validation (Pre-Deploy Check)       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Check migration status first
  await checkMigrationStatus();

  console.log('\n');

  // Validate schema
  const result = await validateSchema();

  if (result.hasDrift || result.errorMessage) {
    console.error('\n╔═══════════════════════════════════════════════════════════╗');
    console.error('║                  🚫 DEPLOYMENT BLOCKED 🚫                  ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');
    process.exit(1);
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              ✅ SAFE TO DEPLOY ✅                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n💥 Unexpected error during validation:');
  console.error(error);
  process.exit(1);
});
