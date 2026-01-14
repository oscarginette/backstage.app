/**
 * Check drafts for info@geebeat.com
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkDrafts() {
  try {
    console.log('Checking drafts for info@geebeat.com...\n');

    // First, get the user ID
    const userResult = await sql`
      SELECT id, email, name
      FROM users
      WHERE email = 'info@geebeat.com'
    `;

    if (userResult.rows.length === 0) {
      console.log('❌ User not found: info@geebeat.com');
      return;
    }

    const user = userResult.rows[0];
    console.log('✓ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || 'N/A'}\n`);

    // Get all campaigns for this user
    const campaignsResult = await sql`
      SELECT
        id,
        subject,
        html_content,
        status,
        scheduled_at,
        created_at,
        updated_at
      FROM email_campaigns
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    console.log(`Found ${campaignsResult.rows.length} total campaigns\n`);

    if (campaignsResult.rows.length === 0) {
      console.log('No campaigns found for this user.');
      return;
    }

    // Show all campaigns
    console.log('All campaigns:');
    console.log('='.repeat(80));
    campaignsResult.rows.forEach((campaign, index) => {
      console.log(`\n${index + 1}. Campaign ID: ${campaign.id}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Subject: ${campaign.subject || '(empty)'}`);
      console.log(`   HTML Content: ${campaign.html_content ? `${campaign.html_content.substring(0, 50)}...` : '(empty)'}`);
      console.log(`   Created: ${campaign.created_at}`);
      console.log(`   Updated: ${campaign.updated_at}`);
      if (campaign.scheduled_at) {
        console.log(`   Scheduled: ${campaign.scheduled_at}`);
      }
    });

    // Count by status
    const drafts = campaignsResult.rows.filter(c => c.status === 'draft');
    const sent = campaignsResult.rows.filter(c => c.status === 'sent');

    console.log('\n' + '='.repeat(80));
    console.log(`\nSummary:`);
    console.log(`  Total campaigns: ${campaignsResult.rows.length}`);
    console.log(`  Drafts: ${drafts.length}`);
    console.log(`  Sent: ${sent.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDrafts();
