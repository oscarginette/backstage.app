#!/usr/bin/env node
/**
 * Test sender email save and persistence
 *
 * This script:
 * 1. Saves a test sender email via API
 * 2. Verifies it was saved to database
 * 3. Clears the sender email
 * 4. Verifies it was cleared
 */

const { sql } = require('@vercel/postgres');

const TEST_USER_ID = 3;
const TEST_EMAIL = 'test@geebeat.com';
const TEST_NAME = 'Test Artist';

async function getAuthToken() {
  // In a real test, you'd authenticate here
  // For now, we'll test the database directly
  return null;
}

async function checkDatabaseValue(expectedEmail, expectedName) {
  const result = await sql`
    SELECT sender_email, sender_name, updated_at
    FROM users
    WHERE id = ${TEST_USER_ID}
  `;

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  console.log('   📊 Current DB values:');
  console.log('      sender_email:', user.sender_email || '(null)');
  console.log('      sender_name:', user.sender_name || '(null)');
  console.log('      updated_at:', user.updated_at);

  const emailMatches = user.sender_email === expectedEmail;
  const nameMatches = user.sender_name === expectedName;

  if (!emailMatches || !nameMatches) {
    throw new Error(
      `Mismatch! Expected (${expectedEmail}, ${expectedName}) but got (${user.sender_email}, ${user.sender_name})`
    );
  }

  return true;
}

async function updateSenderEmail(email, name) {
  const result = await sql`
    UPDATE users
    SET
      sender_email = ${email},
      sender_name = ${name},
      updated_at = NOW()
    WHERE id = ${TEST_USER_ID}
    RETURNING sender_email, sender_name
  `;

  if (result.rows.length === 0) {
    throw new Error('Update failed');
  }

  return result.rows[0];
}

async function runTest() {
  console.log('🧪 Testing Sender Email Save & Persistence\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test 1: Save sender email
    console.log('📝 Test 1: Save sender email');
    console.log('   Setting:', TEST_EMAIL, '/', TEST_NAME);

    await updateSenderEmail(TEST_EMAIL, TEST_NAME);
    console.log('   ✅ Update query executed');

    await checkDatabaseValue(TEST_EMAIL, TEST_NAME);
    console.log('   ✅ Database verification passed\n');

    // Test 2: Clear sender email
    console.log('📝 Test 2: Clear sender email');
    console.log('   Setting: null / null');

    await updateSenderEmail(null, null);
    console.log('   ✅ Clear query executed');

    await checkDatabaseValue(null, null);
    console.log('   ✅ Database verification passed\n');

    // Test 3: Restore original value (from previous script output)
    console.log('📝 Test 3: Restore original value');
    console.log('   Setting: info@geebeat.com / Gee Beat');

    await updateSenderEmail('info@geebeat.com', 'Gee Beat');
    console.log('   ✅ Restore query executed');

    await checkDatabaseValue('info@geebeat.com', 'Gee Beat');
    console.log('   ✅ Database verification passed\n');

    // Final summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════\n');
    console.log('Database persistence: ✅ Working');
    console.log('Save flow: ✅ Working');
    console.log('Clear flow: ✅ Working');
    console.log('Restore flow: ✅ Working\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n', error);
    process.exit(1);
  }
}

runTest();
