/**
 * Promote User to Admin API Route
 *
 * TEMPORARY endpoint for development to promote users to admin role.
 * Should be removed or secured in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';

/**
 * POST /api/admin/promote-user
 *
 * Promote a user to admin role
 *
 * Request Body:
 * {
 *   email: string,
 *   secret: string  // Must match ADMIN_SECRET env var
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Simple secret check (in dev, we'll use a hardcoded secret)
    const secret = body.secret;
    const expectedSecret = env.ADMIN_SECRET || 'dev-secret-123';

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Invalid secret' },
        { status: 403 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Update user role to admin
    const result = await sql`
      UPDATE users
      SET role = 'admin', updated_at = NOW()
      WHERE LOWER(email) = LOWER(${body.email.trim()})
      RETURNING id, email, role, active, created_at;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Promote user API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
