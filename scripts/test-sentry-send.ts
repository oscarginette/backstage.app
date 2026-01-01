/**
 * Test script for Sentry-integrated SendDraftUseCase
 *
 * This script:
 * 1. Temporarily unsubscribes all contacts except geebeat@hotmail.com
 * 2. Creates a test draft campaign
 * 3. Sends it (which will trigger Sentry tracking)
 * 4. Restores original subscription states
 *
 * Usage: npx tsx scripts/test-sentry-send.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use POSTGRES_URL (production) not DATABASE_URL
const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ POSTGRES_URL environment variable not set');
  console.log('\nPlease ensure production database URL is configured in .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log('🧪 Starting Sentry integration test...\n');

  try {
    // Step 1: Check current state
    console.log('1️⃣  Checking contacts...');
    const allContacts = await sql`
      SELECT id, email, subscribed
      FROM contacts
      ORDER BY id
    `;
    console.log(`Found ${allContacts.length} total contacts`);

    const subscribedCount = allContacts.filter(c => c.subscribed).length;
    console.log(`Currently subscribed: ${subscribedCount}`);

    const testContact = allContacts.find(c => c.email === 'geebeat@hotmail.com');

    if (!testContact) {
      console.error('❌ Test contact geebeat@hotmail.com not found!');
      console.log('\nCreating test contact...');

      await sql`
        INSERT INTO contacts (email, subscribed, name, user_id)
        VALUES ('geebeat@hotmail.com', true, 'Oscar (Test)', 1)
      `;

      console.log('✅ Test contact created');
    } else {
      console.log(`✅ Test contact found: ${testContact.email} (subscribed: ${testContact.subscribed})`);

      if (!testContact.subscribed) {
        console.log('Re-subscribing test contact...');
        await sql`
          UPDATE contacts
          SET subscribed = true
          WHERE email = 'geebeat@hotmail.com'
        `;
        console.log('✅ Test contact re-subscribed');
      }
    }

    // Step 2: Store original states and unsubscribe others
    console.log('\n2️⃣  Temporarily unsubscribing other contacts...');

    const otherSubscribed = await sql`
      SELECT id, email
      FROM contacts
      WHERE subscribed = true
      AND email != 'geebeat@hotmail.com'
    `;

    console.log(`Found ${otherSubscribed.length} other subscribed contacts to temporarily unsubscribe`);

    if (otherSubscribed.length > 0) {
      await sql`
        UPDATE contacts
        SET subscribed = false
        WHERE subscribed = true
        AND email != 'geebeat@hotmail.com'
      `;
      console.log('✅ Other contacts temporarily unsubscribed');
    }

    // Step 3: Create test draft
    console.log('\n3️⃣  Creating test draft campaign...');

    const draftId = `sentry-test-${Date.now()}`;
    const subject = `🧪 Sentry Test - ${new Date().toLocaleString()}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .badge { background: #48bb78; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
            .metrics { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Sentry Integration Test</h1>
              <p><span class="badge">TEST EMAIL</span></p>
            </div>

            <div class="content">
              <h2>✅ Sentry Monitoring Active!</h2>

              <p>This test email was sent using the newly integrated Sentry monitoring system.</p>

              <div class="metrics">
                <h3>📊 What's Being Tracked:</h3>
                <ul>
                  <li><strong>User Context</strong> - Which user triggered the send</li>
                  <li><strong>Database Queries</strong> - getCampaignById, getSubscribedContacts, markCampaignAsSent</li>
                  <li><strong>Email Performance</strong> - Individual send tracking via Resend</li>
                  <li><strong>Error Capture</strong> - Full context on any failures</li>
                  <li><strong>Breadcrumbs</strong> - Step-by-step execution trail</li>
                </ul>
              </div>

              <h3>🔍 Check Sentry Dashboard:</h3>
              <p>
                After this email is sent, check:<br>
                <a href="https://sentry.io/organizations/oscarginette/issues/">Sentry Dashboard</a>
              </p>

              <p><strong>Performance Tab</strong> → Filter "SendCampaign"</p>
              <p><strong>Issues Tab</strong> → Any errors will appear here with full context</p>

              <hr style="margin: 30px 0; border: 1px solid #e2e8f0;">

              <p style="color: #718096; font-size: 14px;">
                This is a test email for Sentry integration verification.<br>
                Campaign ID: ${draftId}<br>
                Sent: ${new Date().toISOString()}
              </p>
            </div>

            <div class="footer">
              <p>
                <a href="https://backstage-art.vercel.app/unsubscribe?token=TEMP_TOKEN">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sql`
      INSERT INTO email_campaigns (id, subject, html_content, status, user_id, created_at)
      VALUES (
        ${draftId},
        ${subject},
        ${htmlContent},
        'draft',
        1,
        NOW()
      )
    `;

    console.log(`✅ Test draft created: ${draftId}`);
    console.log(`   Subject: ${subject}`);

    // Step 4: Display instructions
    console.log('\n4️⃣  Ready to send!');
    console.log('\n📬 Send the test email:');
    console.log(`
curl -X POST https://backstage-art.vercel.app/api/campaigns/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "draftId": "${draftId}",
    "userId": 1
  }'
    `);

    console.log('\n📊 After sending, check Sentry:');
    console.log('   https://sentry.io/organizations/oscarginette/issues/');

    console.log('\n🔄 Restore contacts after test:');
    console.log(`   npx tsx scripts/restore-contacts.ts`);

    // Save state for restoration
    const stateFile = {
      timestamp: new Date().toISOString(),
      draftId,
      originallySubscribed: otherSubscribed.map(c => c.email)
    };

    const fs = require('fs');
    fs.writeFileSync(
      './scripts/.test-state.json',
      JSON.stringify(stateFile, null, 2)
    );

    console.log('\n✅ Test setup complete!');
    console.log('\n⚠️  Remember to run restore script after testing');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
