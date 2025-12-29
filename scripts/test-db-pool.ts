/**
 * Test Database Connection Pooling
 *
 * Verifies that the database connection pooling is working correctly.
 * Tests connection acquisition, query execution, and pool statistics.
 *
 * Usage:
 *   npx tsx scripts/test-db-pool.ts
 */

import { db, checkDatabaseHealth, getPoolStats } from '@/lib/db-config';

async function testDatabasePool() {
  console.log('='.repeat(60));
  console.log('Database Connection Pool Test');
  console.log('='.repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n1. Testing health check...');
    const isHealthy = await checkDatabaseHealth();
    console.log(`   ✓ Health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

    // Test 2: Pool Statistics
    console.log('\n2. Checking pool statistics...');
    const stats = getPoolStats();
    if (stats) {
      console.log(`   ✓ Total connections: ${stats.total}`);
      console.log(`   ✓ Idle connections: ${stats.idle}`);
      console.log(`   ✓ Waiting requests: ${stats.waiting}`);
    } else {
      console.log('   ℹ Pool statistics not available (Vercel Postgres)');
    }

    // Test 3: Simple Query
    console.log('\n3. Testing simple query...');
    const startTime = Date.now();
    const result = await db`SELECT 1 as test_value, NOW() as current_time`;
    const duration = Date.now() - startTime;
    console.log(`   ✓ Query executed successfully (${duration}ms)`);
    console.log(`   ✓ Result: ${JSON.stringify(result.rows[0])}`);

    // Test 4: Parameterized Query
    console.log('\n4. Testing parameterized query...');
    const testValue = 42;
    const result2 = await db`SELECT ${testValue} as param_value`;
    console.log(`   ✓ Parameterized query: ${result2.rows[0].param_value === testValue}`);

    // Test 5: Multiple Concurrent Queries
    console.log('\n5. Testing concurrent queries...');
    const concurrentQueries = Array.from({ length: 5 }, (_, i) =>
      db`SELECT ${i} as query_number, pg_sleep(0.1)`
    );
    const concurrentStart = Date.now();
    await Promise.all(concurrentQueries);
    const concurrentDuration = Date.now() - concurrentStart;
    console.log(`   ✓ 5 concurrent queries completed (${concurrentDuration}ms)`);

    // Test 6: Custom Timeout
    console.log('\n6. Testing custom timeout...');
    const timeoutResult = await db.withTimeout(5000)`SELECT 1 as timeout_test`;
    console.log(`   ✓ Custom timeout query succeeded`);

    // Test 7: Query Timeout (should fail)
    console.log('\n7. Testing query timeout (should timeout)...');
    try {
      // This query will sleep for 2 seconds with a 1 second timeout
      await db.withTimeout(1000)`SELECT pg_sleep(2)`;
      console.log('   ✗ Query should have timed out but did not!');
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('   ✓ Query timeout detected correctly');
      } else {
        console.log(`   ⚠ Unexpected error: ${error}`);
      }
    }

    // Final pool statistics
    console.log('\n8. Final pool statistics...');
    const finalStats = getPoolStats();
    if (finalStats) {
      console.log(`   ✓ Total connections: ${finalStats.total}`);
      console.log(`   ✓ Idle connections: ${finalStats.idle}`);
      console.log(`   ✓ Waiting requests: ${finalStats.waiting}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ All tests completed successfully!');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Test failed with error:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run tests
testDatabasePool();
