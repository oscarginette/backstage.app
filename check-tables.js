const { sql } = require('@vercel/postgres');

(async () => {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name;
    `;
    console.log('Found tables:', result.rows.map(r => r.table_name).join(', ') || 'NONE');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
