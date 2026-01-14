const { sql } = require('@vercel/postgres');

(async () => {
  try {
    // Check if tables exist
    const checkResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('contact_lists', 'contact_list_members')
      ORDER BY table_name;
    `;
    
    console.log('Existing tables:', checkResult.rows.map(r => r.table_name).join(', ') || 'NONE');
    
    if (checkResult.rows.length === 2) {
      console.log('✓ Both tables already exist - no migration needed');
      process.exit(0);
    }
    
    console.log('\n⚠️  Tables missing - migration needed');
    console.log('Please run the migration SQL manually or via Prisma');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
