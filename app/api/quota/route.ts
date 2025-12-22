/**
 * GET /api/quota
 *
 * Returns current quota status for authenticated user.
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { CheckQuotaUseCase } from '@/domain/services/CheckQuotaUseCase';
import { PostgresQuotaTrackingRepository } from '@/infrastructure/database/repositories/PostgresQuotaTrackingRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // TODO: Get userId from session/auth middleware
    // For now, using placeholder - replace with actual auth
    const userId = 1; // Replace with: const { userId } = await getSession(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize repository and use case
    const quotaRepository = new PostgresQuotaTrackingRepository();
    const checkQuotaUseCase = new CheckQuotaUseCase(quotaRepository);

    // Execute use case
    const result = await checkQuotaUseCase.execute({ userId });

    return NextResponse.json({
      emailsSentToday: result.emailsSentToday,
      monthlyLimit: result.monthlyLimit,
      remaining: result.remaining,
      resetDate: result.resetDate.toISOString(),
      allowed: result.allowed,
    });
  } catch (error) {
    console.error('GET /api/quota error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Quota tracking not found. Please contact support.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch quota status' },
      { status: 500 }
    );
  }
}
