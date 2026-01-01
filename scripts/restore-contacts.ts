/**
 * Restore contacts to their original subscription state after Sentry test
 *
 * Usage: npx tsx scripts/restore-contacts.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ POSTGRES_URL environment variable not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log('🔄 Restoring contacts...\n');

  try {
    // Read saved state
    const stateFile = path.join(__dirname, '.test-state.json');

    if (!fs.existsSync(stateFile)) {
      console.log('⚠️  No test state file found. Nothing to restore.');
      return;
    }

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    console.log(`📅 Test was run at: ${state.timestamp}`);
    console.log(`📧 Draft ID: ${state.draftId}`);
    console.log(`👥 Contacts to restore: ${state.originallySubscribed.length}\n`);

    if (state.originallySubscribed.length > 0) {
      console.log('Re-subscribing contacts:');
      for (const email of state.originallySubscribed) {
        await sql`
          UPDATE contacts
          SET subscribed = true
          WHERE email = ${email}
        `;
        console.log(`  ✅ ${email}`);
      }
    }

    // Clean up test draft
    console.log(`\n🗑️  Removing test draft: ${state.draftId}`);
    await sql`
      DELETE FROM email_campaigns
      WHERE id = ${state.draftId}
    `;

    // Remove state file
    fs.unlinkSync(stateFile);

    console.log('\n✅ Restoration complete!');
    console.log('All contacts returned to original subscription state.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
