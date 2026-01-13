/**
 * Reset Password API Route (Clean Architecture)
 *
 * POST /api/auth/reset-password
 * Body: { token: string, newPassword: string, newPasswordConfirm: string }
 *
 * Features:
 * - Token validation (64-char hex)
 * - Token expiration check (1 hour)
 * - Password strength validation
 * - bcrypt hashing (10 rounds)
 * - Single-use token (invalidated after use)
 * - IP and User-Agent tracking (GDPR audit trail)
 *
 * Security:
 * - Token checked against database (no client-side validation)
 * - Atomic password update + token invalidation
 *
 * SOLID Compliance:
 * - SRP: This route only handles HTTP orchestration
 * - DIP: Depends on interfaces (IUserRepository)
 * - No business logic here (all in ResetPasswordUseCase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 *
 * Reset user password with token
 *
 * Request Body:
 * {
 *   token: string,
 *   newPassword: string,
 *   newPasswordConfirm: string
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   message: "Password successfully reset. You can now log in with your new password."
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   error: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    let body: {
      token?: string;
      newPassword?: string;
      newPasswordConfirm?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    // 2. Validate required fields
    if (!body.token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reset token is required',
        },
        { status: 400 }
      );
    }

    if (!body.newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'New password is required',
        },
        { status: 400 }
      );
    }

    if (!body.newPasswordConfirm) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password confirmation is required',
        },
        { status: 400 }
      );
    }

    // 3. Extract IP and User-Agent for audit trail (GDPR compliance)
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent') || null;

    // 4. Execute use case (business logic)
    const useCase = UseCaseFactory.createResetPasswordUseCase();
    const result = await useCase.execute({
      token: body.token,
      newPassword: body.newPassword,
      newPasswordConfirm: body.newPasswordConfirm,
      ipAddress,
      userAgent,
    });

    // 5. Return response
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to reset password',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
