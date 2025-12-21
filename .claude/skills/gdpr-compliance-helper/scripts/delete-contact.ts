#!/usr/bin/env tsx
/**
 * GDPR Contact Deletion Tool
 *
 * Anonymizes contact data (GDPR Article 17 - Right to Erasure)
 *
 * IMPORTANT: This performs soft deletion by anonymizing the email
 * and marking as unsubscribed. Historical records are preserved
 * for legal compliance (7 years).
 *
 * Usage:
 *   tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts user@example.com
 *   tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts user@example.com --confirm
 */

import { sql } from '@vercel/postgres';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteContactGDPR(email: string, autoConfirm = false) {
  console.log(`\n🗑️  GDPR Contact Deletion for: ${email}`);
  console.log('═'.repeat(60));

  try {
    // 1. Check if contact exists
    console.log('\n1️⃣  Checking contact exists...');
    const contact = await sql`SELECT * FROM contacts WHERE email = ${email}`;

    if (contact.rows.length === 0) {
      console.log('❌ Contact not found');
      process.exit(1);
    }

    const contactData = contact.rows[0];
    console.log('✅ Contact found:');
    console.log(`   ID: ${contactData.id}`);
    console.log(`   Email: ${contactData.email}`);
    console.log(`   Subscribed: ${contactData.subscribed}`);
    console.log(`   Created: ${contactData.created_at}`);

    // 2. Get data summary
    console.log('\n2️⃣  Analyzing data to be anonymized...');
    const emailCount = await sql`
      SELECT COUNT(*) as count FROM email_logs WHERE contact_email = ${email}
    `;
    const eventCount = await sql`
      SELECT COUNT(*) as count FROM email_events WHERE email = ${email}
    `;

    console.log(`   Email sends: ${emailCount.rows[0].count}`);
    console.log(`   Events tracked: ${eventCount.rows[0].count}`);

    // 3. Confirm deletion
    if (!autoConfirm) {
      console.log('\n⚠️  WARNING: This will:');
      console.log('   - Anonymize the email address');
      console.log('   - Mark contact as unsubscribed');
      console.log('   - Preserve anonymized records for 7 years (legal requirement)');
      console.log('   - This action CANNOT be undone');

      const answer = await question('\n❓ Continue with deletion? (yes/no): ');

      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Deletion cancelled');
        rl.close();
        process.exit(0);
      }
    }

    // 4. Perform anonymization
    console.log('\n3️⃣  Performing GDPR deletion (anonymization)...');

    const anonymizedEmail = `deleted-${contactData.id}@anonymized.local`;
    const deletionTimestamp = new Date().toISOString();

    // Update contact
    await sql`
      UPDATE contacts
      SET
        email = ${anonymizedEmail},
        subscribed = false,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'gdpr_deleted', true,
          'original_email_hash', md5(${email}),
          'deleted_at', ${deletionTimestamp},
          'deletion_reason', 'gdpr_article_17'
        )
      WHERE id = ${contactData.id}
    `;

    // Update email_logs
    await sql`
      UPDATE email_logs
      SET contact_email = ${anonymizedEmail}
      WHERE contact_email = ${email}
    `;

    // Update email_events
    await sql`
      UPDATE email_events
      SET email = ${anonymizedEmail}
      WHERE email = ${email}
    `;

    console.log('✅ Anonymization complete!');
    console.log('═'.repeat(60));
    console.log('\n✅ GDPR Deletion Summary:');
    console.log(`   Original email: ${email}`);
    console.log(`   Anonymized to: ${anonymizedEmail}`);
    console.log(`   Contact ID: ${contactData.id}`);
    console.log(`   Records anonymized:`);
    console.log(`     - Email logs: ${emailCount.rows[0].count}`);
    console.log(`     - Events: ${eventCount.rows[0].count}`);
    console.log(`   Deletion timestamp: ${deletionTimestamp}`);
    console.log('\n📋 Legal Notice:');
    console.log('   - Anonymized records retained for 7 years');
    console.log('   - Contact marked as unsubscribed');
    console.log('   - No further emails will be sent');
    console.log('   - Original email hashed in metadata for verification');

    console.log('\n💾 Audit Trail:');
    console.log('   Location: contacts.metadata.gdpr_deleted = true');
    console.log(`   Verification: SELECT * FROM contacts WHERE id = ${contactData.id};`);

    rl.close();

  } catch (error) {
    console.error('\n❌ Deletion failed:', error);
    rl.close();
    process.exit(1);
  }
}

// Main
const email = process.argv[2];
const autoConfirm = process.argv.includes('--confirm');

if (!email) {
  console.log('Usage: tsx delete-contact.ts <email> [--confirm]');
  console.log('\nExamples:');
  console.log('  tsx delete-contact.ts user@example.com');
  console.log('  tsx delete-contact.ts user@example.com --confirm  # Skip confirmation prompt');
  rl.close();
  process.exit(1);
}

// Validate email format
if (!email.includes('@')) {
  console.log('❌ Invalid email format');
  rl.close();
  process.exit(1);
}

deleteContactGDPR(email, autoConfirm).catch((error) => {
  console.error(error);
  rl.close();
  process.exit(1);
});
