import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function checkExistingData() {
  console.log('🔍 Checking existing data in database...\n');

  try {
    // Check users
    console.log('👥 USERS:');
    const users = await sql`SELECT id, email, role, active, created_at FROM users ORDER BY id`;
    if (users.rows.length === 0) {
      console.log('  No users found\n');
    } else {
      users.rows.forEach(user => {
        console.log(`  [${user.id}] ${user.email} (${user.role}) - Active: ${user.active} - Created: ${user.created_at}`);
      });
      console.log('');
    }

    // Check user_settings
    console.log('⚙️  USER SETTINGS:');
    const settings = await sql`SELECT user_id, soundcloud_user_id, sender_email, sender_name FROM user_settings ORDER BY user_id`;
    if (settings.rows.length === 0) {
      console.log('  No user settings found\n');
    } else {
      settings.rows.forEach(s => {
        console.log(`  User ${s.user_id}: SoundCloud ID: ${s.soundcloud_user_id || 'Not set'}, Sender: ${s.sender_name} <${s.sender_email}>`);
      });
      console.log('');
    }

    // Check contacts
    console.log('📧 CONTACTS:');
    const contacts = await sql`
      SELECT
        user_id,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE subscribed = true) as subscribed,
        COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed
      FROM contacts
      GROUP BY user_id
    `;
    if (contacts.rows.length === 0) {
      console.log('  No contacts found\n');
    } else {
      contacts.rows.forEach(c => {
        console.log(`  User ${c.user_id || 'NULL'}: ${c.total} total (${c.subscribed} subscribed, ${c.unsubscribed} unsubscribed)`);
      });
      // Get total
      const totalContacts = await sql`SELECT COUNT(*) as count FROM contacts`;
      console.log(`  TOTAL: ${totalContacts.rows[0].count} contacts\n`);
    }

    // Check soundcloud_tracks
    console.log('🎵 SOUNDCLOUD TRACKS:');
    const tracks = await sql`
      SELECT
        user_id,
        COUNT(*) as total
      FROM soundcloud_tracks
      GROUP BY user_id
    `;
    if (tracks.rows.length === 0) {
      console.log('  No SoundCloud tracks found\n');
    } else {
      tracks.rows.forEach(t => {
        console.log(`  User ${t.user_id || 'NULL'}: ${t.total} tracks`);
      });
      // Get total and show some examples
      const totalTracks = await sql`SELECT COUNT(*) as count FROM soundcloud_tracks`;
      console.log(`  TOTAL: ${totalTracks.rows[0].count} tracks`);

      const sampleTracks = await sql`SELECT title, published_at, user_id FROM soundcloud_tracks ORDER BY published_at DESC LIMIT 3`;
      if (sampleTracks.rows.length > 0) {
        console.log('  Latest tracks:');
        sampleTracks.rows.forEach(t => {
          console.log(`    - ${t.title} (${t.published_at}) - User: ${t.user_id || 'NULL'}`);
        });
      }
      console.log('');
    }

    // Check email_campaigns
    console.log('📨 EMAIL CAMPAIGNS:');
    const campaigns = await sql`
      SELECT
        user_id,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'draft') as drafts,
        COUNT(*) FILTER (WHERE status = 'sent') as sent
      FROM email_campaigns
      GROUP BY user_id
    `;
    if (campaigns.rows.length === 0) {
      console.log('  No email campaigns found\n');
    } else {
      campaigns.rows.forEach(c => {
        console.log(`  User ${c.user_id || 'NULL'}: ${c.total} total (${c.drafts} drafts, ${c.sent} sent)`);
      });
      const totalCampaigns = await sql`SELECT COUNT(*) as count FROM email_campaigns`;
      console.log(`  TOTAL: ${totalCampaigns.rows[0].count} campaigns\n`);
    }

    // Check email_templates
    console.log('📝 EMAIL TEMPLATES:');
    const templates = await sql`
      SELECT
        user_id,
        COUNT(*) as total
      FROM email_templates
      GROUP BY user_id
    `;
    if (templates.rows.length === 0) {
      console.log('  No email templates found\n');
    } else {
      templates.rows.forEach(t => {
        console.log(`  User ${t.user_id || 'NULL'}: ${t.total} templates`);
      });
      const totalTemplates = await sql`SELECT COUNT(*) as count FROM email_templates`;
      console.log(`  TOTAL: ${totalTemplates.rows[0].count} templates\n`);
    }

    // Check email_logs
    console.log('📬 EMAIL LOGS:');
    const logs = await sql`
      SELECT
        user_id,
        COUNT(*) as total
      FROM email_logs
      GROUP BY user_id
    `;
    if (logs.rows.length === 0) {
      console.log('  No email logs found\n');
    } else {
      logs.rows.forEach(l => {
        console.log(`  User ${l.user_id || 'NULL'}: ${l.total} emails sent`);
      });
      const totalLogs = await sql`SELECT COUNT(*) as count FROM email_logs`;
      console.log(`  TOTAL: ${totalLogs.rows[0].count} emails logged\n`);
    }

    // Summary
    console.log('📊 SUMMARY:');
    const summary = await sql`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM contacts) as contacts,
        (SELECT COUNT(*) FROM soundcloud_tracks) as tracks,
        (SELECT COUNT(*) FROM email_campaigns) as campaigns,
        (SELECT COUNT(*) FROM email_templates) as templates,
        (SELECT COUNT(*) FROM email_logs) as logs
    `;
    const s = summary.rows[0];
    console.log(`  Users: ${s.users}`);
    console.log(`  Contacts: ${s.contacts}`);
    console.log(`  SoundCloud Tracks: ${s.tracks}`);
    console.log(`  Email Campaigns: ${s.campaigns}`);
    console.log(`  Email Templates: ${s.templates}`);
    console.log(`  Email Logs: ${s.logs}`);

    // Check for NULL user_id records
    console.log('\n⚠️  NULL USER_ID RECORDS:');
    const nullRecords = await sql`
      SELECT
        (SELECT COUNT(*) FROM contacts WHERE user_id IS NULL) as contacts,
        (SELECT COUNT(*) FROM soundcloud_tracks WHERE user_id IS NULL) as tracks,
        (SELECT COUNT(*) FROM email_campaigns WHERE user_id IS NULL) as campaigns,
        (SELECT COUNT(*) FROM email_templates WHERE user_id IS NULL) as templates,
        (SELECT COUNT(*) FROM email_logs WHERE user_id IS NULL) as logs
    `;
    const n = nullRecords.rows[0];
    if (parseInt(n.contacts) + parseInt(n.tracks) + parseInt(n.campaigns) + parseInt(n.templates) + parseInt(n.logs) === 0) {
      console.log('  ✅ No NULL user_id records found - all data is properly assigned');
    } else {
      console.log(`  Contacts: ${n.contacts}`);
      console.log(`  SoundCloud Tracks: ${n.tracks}`);
      console.log(`  Email Campaigns: ${n.campaigns}`);
      console.log(`  Email Templates: ${n.templates}`);
      console.log(`  Email Logs: ${n.logs}`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

checkExistingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
