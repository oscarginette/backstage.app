/**
 * POST /api/send-track
 *
 * Send email for a SoundCloud track with quota enforcement.
 * Uses SendTrackEmailUseCase with quota tracking.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { SendTrackEmailUseCase } from '@/domain/services/SendTrackEmailUseCase';
import { PostgresQuotaTrackingRepository } from '@/infrastructure/database/repositories/PostgresQuotaTrackingRepository';
import { resendEmailProvider } from '@/infrastructure/email';
import { QuotaExceededError } from '@/domain/services/CheckQuotaUseCase';
import { auth } from '@/lib/auth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Send track email with quota enforcement
 *
 * Body:
 * - to: string (required) - Recipient email
 * - subject: string (required) - Email subject
 * - html: string (required) - Email HTML content
 * - from: string (optional) - Sender email
 * - replyTo: string (optional) - Reply-to email
 * - headers: Record<string, string> (optional) - Custom headers
 *
 * Response:
 * {
 *   success: boolean,
 *   messageId?: string,
 *   error?: string,
 *   quotaRemaining: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Initialize repository and use case
    const quotaRepository = new PostgresQuotaTrackingRepository();
    const useCase = new SendTrackEmailUseCase(
      resendEmailProvider,
      quotaRepository
    );

    // Execute use case
    const result = await useCase.execute({
      userId,
      to: body.to,
      subject: body.subject,
      html: body.html,
      from: body.from,
      replyTo: body.replyTo,
      headers: body.headers
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending track email:', error);

    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 } // Too Many Requests
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
