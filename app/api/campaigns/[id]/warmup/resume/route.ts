import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * POST /api/campaigns/[id]/warmup/resume
 *
 * Resumes a paused warm-up campaign.
 */
export async function POST(
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
    const useCase = UseCaseFactory.createResumeWarmupCampaignUseCase();

    const result = await useCase.execute({
      userId,
      campaignId
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
