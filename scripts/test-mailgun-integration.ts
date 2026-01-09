/**
 * Mailgun Integration Test Script
 *
 * Tests the Mailgun email provider integration with various scenarios.
 *
 * Usage:
 *   tsx scripts/test-mailgun-integration.ts
 *
 * Prerequisites:
 *   - MAILGUN_API_KEY set in .env
 *   - MAILGUN_DOMAIN set in .env
 *   - For sandbox: Add recipient to authorized recipients in Mailgun dashboard
 */

import { MailgunEmailProvider } from '../infrastructure/email/MailgunEmailProvider';

// Test configuration
const TEST_CONFIG = {
  apiKey: process.env.MAILGUN_API_KEY || '',
  domain: process.env.MAILGUN_DOMAIN || '',
  apiUrl: process.env.MAILGUN_API_URL || 'https://api.mailgun.net',
  recipient: 'info@thebackstage.app',
};

async function testMailgunIntegration() {
  console.log('🧪 Testing Mailgun Integration\n');
  console.log('Configuration:');
  console.log(`  API URL: ${TEST_CONFIG.apiUrl}`);
  console.log(`  Domain: ${TEST_CONFIG.domain}`);
  console.log(`  API Key: ${TEST_CONFIG.apiKey.substring(0, 10)}...`);
  console.log(`  Recipient: ${TEST_CONFIG.recipient}\n`);

  if (!TEST_CONFIG.apiKey || !TEST_CONFIG.domain) {
    console.error('❌ Error: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set in .env');
    process.exit(1);
  }

  const provider = new MailgunEmailProvider(
    TEST_CONFIG.apiKey,
    TEST_CONFIG.domain,
    TEST_CONFIG.apiUrl
  );

  // Test 1: Simple email
  console.log('📧 Test 1: Sending simple email...');
  try {
    const result1 = await provider.send({
      to: TEST_CONFIG.recipient,
      subject: 'Test Email from Mailgun - Simple',
      html: '<h1>Hello from Mailgun!</h1><p>This is a test email from The Backstage app.</p><p>If you received this, the integration is working! 🎉</p>',
    });

    if (result1.success) {
      console.log('✅ Test 1 PASSED');
      console.log(`   Message ID: ${result1.id}`);
    } else {
      console.error('❌ Test 1 FAILED');
      console.error(`   Error: ${result1.error}`);
    }
  } catch (error) {
    console.error('❌ Test 1 FAILED with exception:', error);
  }

  console.log('');

  // Test 2: Email with tags
  console.log('🏷️  Test 2: Sending email with tags...');
  try {
    const result2 = await provider.send({
      to: TEST_CONFIG.recipient,
      subject: 'Test Email from Mailgun - With Tags',
      html: '<p>This email has tags for tracking.</p><ul><li>campaign_id: test-campaign</li><li>environment: sandbox</li></ul>',
      tags: [
        { name: 'campaign_id', value: 'test-campaign' },
        { name: 'environment', value: 'sandbox' },
        { name: 'test_run', value: new Date().toISOString() },
      ],
    });

    if (result2.success) {
      console.log('✅ Test 2 PASSED');
      console.log(`   Message ID: ${result2.id}`);
    } else {
      console.error('❌ Test 2 FAILED');
      console.error(`   Error: ${result2.error}`);
    }
  } catch (error) {
    console.error('❌ Test 2 FAILED with exception:', error);
  }

  console.log('');

  // Test 3: Email with List-Unsubscribe header
  console.log('🔗 Test 3: Sending email with List-Unsubscribe header...');
  try {
    const result3 = await provider.send({
      to: TEST_CONFIG.recipient,
      subject: 'Test Email from Mailgun - With Unsubscribe',
      html: '<p>This email has an unsubscribe header (CAN-SPAM compliant).</p><p>Check the email headers for List-Unsubscribe.</p>',
      unsubscribeUrl: 'https://thebackstage.app/unsubscribe?token=test-token-123',
    });

    if (result3.success) {
      console.log('✅ Test 3 PASSED');
      console.log(`   Message ID: ${result3.id}`);
    } else {
      console.error('❌ Test 3 FAILED');
      console.error(`   Error: ${result3.error}`);
    }
  } catch (error) {
    console.error('❌ Test 3 FAILED with exception:', error);
  }

  console.log('');

  // Test 4: Email with Reply-To
  console.log('↩️  Test 4: Sending email with Reply-To...');
  try {
    const result4 = await provider.send({
      to: TEST_CONFIG.recipient,
      subject: 'Test Email from Mailgun - With Reply-To',
      html: '<p>This email has a Reply-To address.</p><p>Try replying to this email - it should go to test@thebackstage.app</p>',
      replyTo: 'test@thebackstage.app',
    });

    if (result4.success) {
      console.log('✅ Test 4 PASSED');
      console.log(`   Message ID: ${result4.id}`);
    } else {
      console.error('❌ Test 4 FAILED');
      console.error(`   Error: ${result4.error}`);
    }
  } catch (error) {
    console.error('❌ Test 4 FAILED with exception:', error);
  }

  console.log('');

  // Test 5: Email with custom headers
  console.log('📋 Test 5: Sending email with custom headers...');
  try {
    const result5 = await provider.send({
      to: TEST_CONFIG.recipient,
      subject: 'Test Email from Mailgun - With Custom Headers',
      html: '<p>This email has custom headers.</p>',
      headers: {
        'X-Test-Header': 'test-value',
        'X-Environment': 'sandbox',
      },
    });

    if (result5.success) {
      console.log('✅ Test 5 PASSED');
      console.log(`   Message ID: ${result5.id}`);
    } else {
      console.error('❌ Test 5 FAILED');
      console.error(`   Error: ${result5.error}`);
    }
  } catch (error) {
    console.error('❌ Test 5 FAILED with exception:', error);
  }

  console.log('');
  console.log('🎉 All tests completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check your inbox at', TEST_CONFIG.recipient);
  console.log('2. Verify all 5 emails were received');
  console.log('3. Check email headers for tags, unsubscribe, reply-to');
  console.log('4. Monitor Mailgun dashboard for delivery events');
}

// Run tests
testMailgunIntegration().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
