#!/usr/bin/env tsx
/**
 * GDPR Data Export Tool
 *
 * Exports all data for a contact (GDPR Article 15 - Right of Access)
 *
 * Usage:
 *   tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts user@example.com
 */

import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

async function exportContactData(email: string) {
  console.log(`\n📋 GDPR Data Export for: ${email}`);
  console.log('═'.repeat(60));

  try {
    // 1. Contact profile
    console.log('\n1️⃣  Fetching contact profile...');
    const contact = await sql`SELECT * FROM contacts WHERE email = ${email}`;

    if (contact.rows.length === 0) {
      console.log('❌ Contact not found');
      process.exit(1);
    }

    // 2. Email send history
    console.log('2️⃣  Fetching email send history...');
    const emailLogs = await sql`
      SELECT * FROM email_logs
      WHERE contact_email = ${email}
      ORDER BY sent_at DESC
    `;

    // 3. Email engagement events
    console.log('3️⃣  Fetching engagement events...');
    const events = await sql`
      SELECT * FROM email_events
      WHERE email = ${email}
      ORDER BY timestamp DESC
    `;

    // 4. Execution logs where contact was included
    console.log('4️⃣  Fetching campaign participation...');
    const campaigns = await sql`
      SELECT DISTINCT el.*
      FROM execution_logs el
      JOIN email_logs eml ON eml.execution_log_id = el.id
      WHERE eml.contact_email = ${email}
      ORDER BY el.executed_at DESC
    `;

    // 5. Tracks sent to contact
    console.log('5️⃣  Fetching tracks sent...');
    const tracks = await sql`
      SELECT DISTINCT st.*
      FROM soundcloud_tracks st
      JOIN email_logs eml ON eml.track_id::text = st.track_id
      WHERE eml.contact_email = ${email}
      ORDER BY st.sent_at DESC
    `;

    // Build export object
    const exportData = {
      export_metadata: {
        email: email,
        export_date: new Date().toISOString(),
        purpose: 'GDPR Article 15 - Right of Access',
        retention_notice: 'Data will be retained for 7 years for legal compliance'
      },
      contact_profile: contact.rows[0],
      email_send_history: {
        total_emails: emailLogs.rows.length,
        records: emailLogs.rows
      },
      engagement_events: {
        total_events: events.rows.length,
        summary: {
          sent: events.rows.filter(e => e.event_type === 'sent').length,
          delivered: events.rows.filter(e => e.event_type === 'delivered').length,
          opened: events.rows.filter(e => e.event_type === 'opened').length,
          clicked: events.rows.filter(e => e.event_type === 'clicked').length,
          bounced: events.rows.filter(e => e.event_type === 'bounced').length,
        },
        records: events.rows
      },
      campaign_participation: {
        total_campaigns: campaigns.rows.length,
        records: campaigns.rows
      },
      tracks_received: {
        total_tracks: tracks.rows.length,
        records: tracks.rows
      }
    };

    // Save to file
    const filename = `gdpr-export-${email.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
    const filepath = path.join(process.cwd(), 'exports', filename);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log('\n✅ Export Complete!');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Contact: ${exportData.contact_profile.email}`);
    console.log(`   Subscribed: ${exportData.contact_profile.subscribed}`);
    console.log(`   Total emails sent: ${exportData.email_send_history.total_emails}`);
    console.log(`   Total events: ${exportData.engagement_events.total_events}`);
    console.log(`     - Sent: ${exportData.engagement_events.summary.sent}`);
    console.log(`     - Delivered: ${exportData.engagement_events.summary.delivered}`);
    console.log(`     - Opened: ${exportData.engagement_events.summary.opened}`);
    console.log(`     - Clicked: ${exportData.engagement_events.summary.clicked}`);
    console.log(`     - Bounced: ${exportData.engagement_events.summary.bounced}`);
    console.log(`   Campaigns participated: ${exportData.campaign_participation.total_campaigns}`);
    console.log(`   Tracks received: ${exportData.tracks_received.total_tracks}`);
    console.log(`\n💾 Exported to: ${filepath}`);
    console.log('\n📧 You can now send this file to the data subject');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Main
const email = process.argv[2];

if (!email) {
  console.log('Usage: tsx export-contact-data.ts <email>');
  console.log('\nExample:');
  console.log('  tsx export-contact-data.ts user@example.com');
  process.exit(1);
}

// Validate email format
if (!email.includes('@')) {
  console.log('❌ Invalid email format');
  process.exit(1);
}

exportContactData(email).catch(console.error);
