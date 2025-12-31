import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const migrationPath = path.join(process.cwd(), 'sql', 'migration-email-templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Vercel Postgres requires template literal syntax
    // Note: This is a security risk for raw SQL execution
    // Production: Use proper migration tools instead of HTTP endpoints
    await sql.query(migrationSQL);

    return NextResponse.json({ success: true, message: 'Templates migration executed' });
  } catch (error: unknown) {
    // If sql.query fails due to Vercel Postgres restrictions,
    // this endpoint should be disabled and migrations run via CLI
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      note: "Use `npm run migrate` instead for Vercel Postgres compatibility"
    }, { status: 500 });
  }
}
