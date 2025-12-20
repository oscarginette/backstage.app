require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkConfig() {
  try {
    const result = await sql`SELECT * FROM app_config`;
    console.log('Config rows:', result.rows);

    if (result.rows.length === 0) {
      console.log('\n❌ No config found, inserting...');
      await sql`INSERT INTO app_config (id, brevo_list_ids) VALUES (1, '[2,3]')`;
      console.log('✅ Config inserted');
    } else {
      const config = result.rows[0];
      console.log('\nConfig data:');
      console.log('  ID:', config.id);
      console.log('  brevo_list_ids:', config.brevo_list_ids);
      console.log('  brevo_list_ids type:', typeof config.brevo_list_ids);
      console.log('  brevo_list_ids length:', config.brevo_list_ids ? config.brevo_list_ids.length : 0);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkConfig();
