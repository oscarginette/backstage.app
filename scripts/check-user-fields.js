/**
 * Check if sender_email and sender_name exist in users table
 */

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkFields() {
  try {
    console.log('Checking users table structure...\n');

    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('Users table columns:');
    console.log('='.repeat(60));
    result.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(30)} ${col.data_type.padEnd(15)} ${col.is_nullable}`);
    });

    // Check specifically for sender fields
    const senderEmail = result.rows.find(col => col.column_name === 'sender_email');
    const senderName = result.rows.find(col => col.column_name === 'sender_name');

    console.log('\n' + '='.repeat(60));
    console.log(`\nsender_email exists: ${!!senderEmail}`);
    console.log(`sender_name exists: ${!!senderName}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkFields();
