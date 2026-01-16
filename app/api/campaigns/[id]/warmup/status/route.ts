import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * GET /api/campaigns/[id]/warmup/status
 *
 * Returns comprehensive warm-up status including progress, health, and next batch info.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Execute use case
    const useCase = UseCaseFactory.createGetWarmupStatusUseCase();

    const result = await useCase.execute({
      userId,
      campaignId: params.id
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
