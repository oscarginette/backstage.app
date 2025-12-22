import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

config({ path: '.env.local' });

async function checkTables() {
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  
  console.log('Tables in database:');
  result.rows.forEach(row => console.log(`  - ${row.table_name}`));
}

checkTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
