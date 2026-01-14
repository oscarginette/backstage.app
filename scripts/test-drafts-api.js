/**
 * Test the drafts API endpoint
 */

require('dotenv').config({ path: '.env.local' });

async function testDraftsAPI() {
  try {
    console.log('Testing GET /api/campaigns?status=draft endpoint...\n');

    // Simulate the API request
    const { sql } = require('@vercel/postgres');

    // Get user ID for info@geebeat.com
    const userResult = await sql`
      SELECT id FROM users WHERE email = 'info@geebeat.com'
    `;

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`User ID: ${userId}\n`);

    // Simulate the query that the API should be running
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE user_id = ${userId} AND status = 'draft'
      ORDER BY created_at DESC
    `;

    console.log(`Found ${result.rows.length} drafts:\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Draft ID: ${row.id}`);
      console.log(`   Subject: ${row.subject || '(empty)'}`);
      console.log(`   HTML Content: ${row.html_content ? 'Present' : '(empty)'}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testDraftsAPI();
