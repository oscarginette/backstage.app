import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'email_campaigns'
  AND column_name IN ('greeting', 'message', 'signature', 'cover_image_url', 'warmup_enabled')
  ORDER BY column_name
`;

console.log('📋 New columns in email_campaigns:');
result.rows.forEach(row => {
  console.log(`  - ${row.column_name}: ${row.data_type}`);
});
process.exit(0);
