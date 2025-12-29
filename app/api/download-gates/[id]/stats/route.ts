/**
 * GET /api/download-gates/[id]/stats
 * Get detailed statistics for a download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates/[id]/stats
 * Returns detailed stats for a gate
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id } = await params;

    // Get use case from factory (DI)
    const getStatsUseCase = UseCaseFactory.createGetGateStatsUseCase();

    // Execute
    const result = await getStatsUseCase.execute({
      userId,
      gateId: id,
    });

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ stats: result.stats });
  } catch (error) {
    console.error('GET /api/download-gates/[id]/stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
