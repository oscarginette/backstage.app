import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT id, subject, status, warmup_enabled, warmup_current_day
  FROM email_campaigns
  WHERE status = 'draft'
  ORDER BY created_at DESC
  LIMIT 5
`;

console.log('📧 Drafts in database:');
console.log(JSON.stringify(result.rows, null, 2));
process.exit(0);
