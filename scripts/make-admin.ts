#!/usr/bin/env tsx

/**
 * Make User Admin Script
 * Updates a user's role to 'admin'
 */

import 'dotenv/config';
import { sql } from '@/lib/db';

async function makeUserAdmin() {
  try {
    const email = process.argv[2] || 'admin@backstage-art.com';

    console.log(`🔐 Making user admin: ${email}`);

    const result = await sql`
      UPDATE users
      SET role = 'admin', updated_at = NOW()
      WHERE email = ${email.toLowerCase().trim()}
      RETURNING id, email, role, active, created_at;
    `;

    if (result.rows.length === 0) {
      console.error(`\n❌ User not found: ${email}`);
      console.log('\n💡 Create the user first using the signup form or API');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('\n✅ User updated successfully:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.active}`);
    console.log(`   Created: ${user.created_at}`);

    console.log('\n🎉 User is now an admin!');

  } catch (error) {
    console.error('\n❌ Error updating user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

makeUserAdmin();
