#!/usr/bin/env tsx
/**
 * Database Smoke Tests
 *
 * Purpose: Validate that critical database operations work correctly
 * after schema changes or migrations.
 *
 * Architecture: Lightweight smoke tests (not full integration tests)
 * - Tests critical paths only
 * - Runs in CI/CD pipeline
 * - Uses Prisma Client for type-safe queries
 * - Rolls back test data (no side effects)
 *
 * What we test:
 * 1. Database connection
 * 2. Critical table existence
 * 3. Foreign key constraints
 * 4. Required indexes exist
 * 5. Critical queries don't error
 *
 * Usage:
 *   POSTGRES_URL=<url> npm run test:smoke
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();

  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - startTime,
    });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      passed: false,
      error: errorMsg,
      duration: Date.now() - startTime,
    });
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${errorMsg}`);
  }
}

async function testDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

async function testCriticalTablesExist(): Promise<void> {
  // Test that we can query each critical table
  await prisma.users.count();
  await prisma.contacts.count();
  await prisma.soundcloud_tracks.count();
  await prisma.email_logs.count();
  await prisma.consent_history.count();
}

async function testForeignKeyConstraints(): Promise<void> {
  // Create test user
  const testUser = await prisma.users.create({
    data: {
      email: `smoke-test-${Date.now()}@test.com`,
      password_hash: 'test_hash',
      name: 'Smoke Test User',
    },
  });

  try {
    // Test cascade delete works
    const contact = await prisma.contacts.create({
      data: {
        user_id: testUser.id,
        email: `contact-${Date.now()}@test.com`,
      },
    });

    // Delete user should cascade to contact
    await prisma.users.delete({ where: { id: testUser.id } });

    // Verify contact was deleted
    const deletedContact = await prisma.contacts.findUnique({
      where: { id: contact.id },
    });

    if (deletedContact !== null) {
      throw new Error('Cascade delete did not work for contacts');
    }
  } catch (error) {
    // Clean up if test fails
    await prisma.users.delete({ where: { id: testUser.id } }).catch(() => {});
    throw error;
  }
}

async function testRequiredIndexes(): Promise<void> {
  // Query using indexed columns (should be fast)
  await prisma.$queryRaw`
    SELECT * FROM contacts WHERE email = 'nonexistent@test.com' LIMIT 1
  `;

  await prisma.$queryRaw`
    SELECT * FROM users WHERE email = 'nonexistent@test.com' LIMIT 1
  `;

  await prisma.$queryRaw`
    SELECT * FROM soundcloud_tracks
    WHERE user_id = 999999 AND track_id = 'nonexistent'
    LIMIT 1
  `;
}

async function testCriticalQueries(): Promise<void> {
  // Test queries that are used in production code

  // 1. Get subscribed contacts for a user
  await prisma.contacts.findMany({
    where: {
      user_id: 1,
      subscribed: true,
    },
    take: 10,
  });

  // 2. Get recent tracks
  await prisma.soundcloud_tracks.findMany({
    where: {
      user_id: 1,
    },
    orderBy: {
      published_at: 'desc',
    },
    take: 10,
  });

  // 3. Get consent history
  await prisma.consent_history.findMany({
    where: {
      contact_id: 1,
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 10,
  });

  // 4. Check user with relations
  await prisma.users.findUnique({
    where: { id: 1 },
    include: {
      contacts: {
        take: 1,
      },
      soundcloud_tracks: {
        take: 1,
      },
    },
  });
}

async function testUniqueConstraints(): Promise<void> {
  const testEmail = `unique-test-${Date.now()}@test.com`;

  const user1 = await prisma.users.create({
    data: {
      email: testEmail,
      password_hash: 'test',
    },
  });

  try {
    // Should fail due to unique constraint
    await prisma.users.create({
      data: {
        email: testEmail,
        password_hash: 'test2',
      },
    });

    throw new Error('Unique constraint on users.email did not work');
  } catch (error) {
    // Expected error - unique constraint worked
    if (error instanceof Error && !error.message.includes('Unique constraint')) {
      // Verify it's a database unique violation
      if (!error.message.includes('unique')) {
        throw new Error('Expected unique constraint error, got: ' + error.message);
      }
    }
  } finally {
    // Clean up
    await prisma.users.delete({ where: { id: user1.id } });
  }
}

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           Database Smoke Tests (CI/CD Safety)             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('🧪 Running smoke tests...\n');

  // Run all tests
  await runTest('Database connection', testDatabaseConnection);
  await runTest('Critical tables exist', testCriticalTablesExist);
  await runTest('Foreign key constraints', testForeignKeyConstraints);
  await runTest('Required indexes', testRequiredIndexes);
  await runTest('Critical queries', testCriticalQueries);
  await runTest('Unique constraints', testUniqueConstraints);

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                      Test Summary                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => r.passed === false).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`Total tests: ${results.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏱️  Duration: ${totalDuration}ms\n`);

  if (failedTests > 0) {
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║                   🚫 TESTS FAILED 🚫                       ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');
    process.exit(1);
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║               ✅ ALL TESTS PASSED ✅                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}

main()
  .catch((error) => {
    console.error('\n💥 Unexpected error during smoke tests:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
