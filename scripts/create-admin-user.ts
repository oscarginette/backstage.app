#!/usr/bin/env tsx

/**
 * Create Admin User Script
 *
 * Creates an admin user with email: admin@backstage-art.com
 * Password must meet validation requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 */

import 'dotenv/config';
import { hash } from 'bcrypt';
import { sql } from '@/lib/db';

async function createAdminUser() {
  try {
    const email = 'admin@backstage-art.com';
    const password = 'Admin123'; // Meets all validation requirements

    console.log('🔐 Creating admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    // Hash the password with bcrypt (same as User.createNew)
    const passwordHash = await hash(password, 10);

    // Create or update admin user
    const result = await sql`
      INSERT INTO users (email, password_hash, role, active, created_at, updated_at)
      VALUES (
        ${email.toLowerCase().trim()},
        ${passwordHash},
        'admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = ${passwordHash},
        role = 'admin',
        active = true,
        updated_at = NOW()
      RETURNING id, email, role, active, created_at;
    `;

    console.log('\n✅ Admin user created/updated successfully:');
    console.log(`   User ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log(`   Active: ${result.rows[0].active}`);
    console.log(`   Created: ${result.rows[0].created_at}`);

    console.log('\n🎉 You can now login at http://localhost:3002/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
