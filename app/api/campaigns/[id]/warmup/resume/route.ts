import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * POST /api/campaigns/[id]/warmup/resume
 *
 * Resumes a paused warm-up campaign.
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

    // 2. Execute use case
    const useCase = UseCaseFactory.createResumeWarmupCampaignUseCase();

    const result = await useCase.execute({
      userId,
      campaignId: params.id
    });

    // 3. Return result
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[POST /api/campaigns/[id]/warmup/resume] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
