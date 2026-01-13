/**
 * Forgot Password API Route (Clean Architecture)
 *
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Features:
 * - Email validation
 * - No email enumeration (same response always)
 * - Crypto-secure token generation
 * - 1-hour token expiration
 * - Password reset email with magic link
 * - IP and User-Agent tracking (GDPR audit trail)
 *
 * Security:
 * - Rate limiting recommended (implement at Vercel/middleware level)
 * - CAPTCHA recommended for production (prevents abuse)
 *
 * SOLID Compliance:
 * - SRP: This route only handles HTTP orchestration
 * - DIP: Depends on interfaces (IUserRepository, IEmailProvider)
 * - No business logic here (all in RequestPasswordResetUseCase)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/forgot-password
 *
 * Request password reset email
 *
 * Request Body:
 * {
 *   email: string
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   message: "If an account exists with that email, you will receive password reset instructions."
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    // 2. Validate email presence
    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
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

    // 4. Build reset URL from environment
    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password`;

    // 5. Execute use case (business logic)
    const useCase = UseCaseFactory.createRequestPasswordResetUseCase();
    const result = await useCase.execute({
      email: body.email,
      resetUrl,
      ipAddress,
      userAgent,
    });

    // 6. Return response
    // SECURITY: Always returns 200 (no email enumeration)
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
