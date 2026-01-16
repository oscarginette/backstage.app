import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * POST /api/campaigns/[id]/warmup/pause
 *
 * Pauses warm-up for a campaign (manual pause by user).
 */
export async function POST(
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

    // 2. Parse request body
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // 3. Execute use case
    const useCase = UseCaseFactory.createPauseWarmupCampaignUseCase();

    const result = await useCase.execute({
      userId,
      campaignId: params.id,
      reason
    });

    // 4. Return result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[POST /api/campaigns/[id]/warmup/pause] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
