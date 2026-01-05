#!/usr/bin/env tsx
/**
 * Test All Webhook Events
 *
 * Simulates a complete email journey:
 * sent → delivered → opened → clicked
 *
 * Usage:
 *   tsx .claude/skills/webhook-debugger/scripts/test-all-events.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

const emailId = `re_test_journey_${Date.now()}`;
const testEmail = 'webhook-test@example.com';

const eventSequence = [
  {
    name: 'Email Sent',
    delay: 0,
    payload: {
      type: 'email.sent',
      created_at: new Date().toISOString(),
      data: {
        email_id: emailId,
        from: 'info@thebackstage.app',
        to: [testEmail],
        subject: 'Test Track: Complete Journey',
        created_at: new Date().toISOString()
      }
    }
  },
  {
    name: 'Email Delivered',
    delay: 2000,
    payload: {
      type: 'email.delivered',
      created_at: new Date().toISOString(),
      data: {
        email_id: emailId,
        from: 'info@thebackstage.app',
        to: [testEmail],
        subject: 'Test Track: Complete Journey'
      }
    }
  },
  {
    name: 'Email Opened',
    delay: 5000,
    payload: {
      type: 'email.opened',
      created_at: new Date().toISOString(),
      data: {
        email_id: emailId,
        to: [testEmail]
      }
    }
  },
  {
    name: 'Email Clicked',
    delay: 3000,
    payload: {
      type: 'email.clicked',
      created_at: new Date().toISOString(),
      data: {
        email_id: emailId,
        to: [testEmail],
        click: {
          link: 'https://soundcloud.com/test-track',
          timestamp: new Date().toISOString()
        }
      }
    }
  }
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEvent(event: typeof eventSequence[0]) {
  console.log(`\n📧 ${event.name}...`);

  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.payload)
    });

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      const text = await response.text();
      console.log(`   Error: ${text}`);
    }
  } catch (error) {
    console.log(`   ❌ Failed:`, error);
  }
}

async function testEmailJourney() {
  console.log('🚀 Starting Email Journey Test');
  console.log('Email ID:', emailId);
  console.log('Recipient:', testEmail);
  console.log('═'.repeat(50));

  for (const event of eventSequence) {
    if (event.delay > 0) {
      console.log(`\n⏱️  Waiting ${event.delay}ms...`);
      await sleep(event.delay);
    }
    await sendEvent(event);
  }

  console.log('\n═'.repeat(50));
  console.log('✅ Email Journey Complete!');
  console.log('\nCheck results:');
  console.log(`  Database: SELECT * FROM email_events WHERE email = '${testEmail}' ORDER BY timestamp;`);
  console.log(`  API: curl ${BASE_URL}/api/email-stats`);
}

testEmailJourney().catch(console.error);
