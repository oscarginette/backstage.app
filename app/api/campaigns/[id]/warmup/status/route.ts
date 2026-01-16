import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * GET /api/campaigns/[id]/warmup/status
 *
 * Returns comprehensive warm-up status including progress, health, and next batch info.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { id: campaignId } = await context.params;

    // 2. Execute use case
    const useCase = UseCaseFactory.createGetWarmupStatusUseCase();

    const result = await useCase.execute({
      userId,
      campaignId
    });

    // 3. Return result
    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET /api/campaigns/[id]/warmup/status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
