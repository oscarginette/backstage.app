#!/usr/bin/env tsx
/**
 * Webhook Replay Tool
 *
 * Usage:
 *   tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent
 *   tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend opened
 *   tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts hypedit contact
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

const mockResendEvents = {
  sent: {
    type: 'email.sent',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_sent_${Date.now()}`,
      from: 'info@thebackstage.app',
      to: ['test@example.com'],
      subject: 'Test Track: Debugging Session',
      created_at: new Date(Date.now() - 1000).toISOString()
    }
  },

  delivered: {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_delivered_${Date.now()}`,
      from: 'info@thebackstage.app',
      to: ['test@example.com'],
      subject: 'Test Track: Debugging Session'
    }
  },

  opened: {
    type: 'email.opened',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_opened_${Date.now()}`,
      to: ['test@example.com']
    }
  },

  clicked: {
    type: 'email.clicked',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_clicked_${Date.now()}`,
      to: ['test@example.com'],
      click: {
        link: 'https://soundcloud.com/track/test',
        timestamp: new Date().toISOString()
      }
    }
  },

  bounced: {
    type: 'email.bounced',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_bounced_${Date.now()}`,
      to: ['bounce@simulator.amazonses.com'],
      bounce: {
        type: 'hard',
        reason: 'Mailbox does not exist'
      }
    }
  },

  delayed: {
    type: 'email.delivery_delayed',
    created_at: new Date().toISOString(),
    data: {
      email_id: `re_mock_delayed_${Date.now()}`,
      to: ['delayed@example.com'],
      delay: {
        reason: 'Mailbox full',
        retry_at: new Date(Date.now() + 3600000).toISOString()
      }
    }
  }
};

const mockHypeditEvents = {
  contact: {
    email: `test-${Date.now()}@example.com`,
    country: 'US',
    source: 'hypedit',
    metadata: {
      signup_date: new Date().toISOString().split('T')[0],
      referrer: 'test-script'
    }
  }
};

async function replayWebhook(endpoint: string, eventType: string) {
  let payload: any;
  let url: string;

  if (endpoint === 'resend') {
    url = `${BASE_URL}/api/webhooks/resend`;
    payload = mockResendEvents[eventType as keyof typeof mockResendEvents];

    if (!payload) {
      console.error(`Unknown Resend event type: ${eventType}`);
      console.log('Available events:', Object.keys(mockResendEvents).join(', '));
      process.exit(1);
    }
  } else if (endpoint === 'hypedit') {
    url = `${BASE_URL}/api/webhook/hypedit`;
    payload = mockHypeditEvents[eventType as keyof typeof mockHypeditEvents];

    if (!payload) {
      console.error(`Unknown Hypedit event type: ${eventType}`);
      console.log('Available events:', Object.keys(mockHypeditEvents).join(', '));
      process.exit(1);
    }
  } else {
    console.error(`Unknown endpoint: ${endpoint}`);
    console.log('Available endpoints: resend, hypedit');
    process.exit(1);
  }

  console.log(`\n🔄 Replaying ${endpoint} webhook: ${eventType}`);
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\n📤 Sending...\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status, response.statusText);

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch {
      console.log('Response:', text);
    }

    console.log('\n✅ Webhook replayed successfully\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Main
const [endpoint, eventType] = process.argv.slice(2);

if (!endpoint || !eventType) {
  console.log('Usage: tsx replay-webhook.ts <endpoint> <eventType>');
  console.log('\nExamples:');
  console.log('  tsx replay-webhook.ts resend sent');
  console.log('  tsx replay-webhook.ts resend opened');
  console.log('  tsx replay-webhook.ts resend clicked');
  console.log('  tsx replay-webhook.ts resend bounced');
  console.log('  tsx replay-webhook.ts hypedit contact');
  process.exit(1);
}

replayWebhook(endpoint, eventType);
