/**
 * GET /api/download-gates/[id]/submissions
 * Get all submissions for a download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { serializeSubmission } from '@/lib/serialization';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates/[id]/submissions
 * Returns all submissions for a gate
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
    const listSubmissionsUseCase = UseCaseFactory.createListGateSubmissionsUseCase();

    // Execute
    const result = await listSubmissionsUseCase.execute({ userId, gateId: id });

    if (!result.success) {
      if (result.error?.includes('not found') || result.error?.includes('access denied')) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Serialize submissions
    const serializedSubmissions = result.submissions!.map(submission =>
      serializeSubmission(submission)
    );

    return NextResponse.json({ submissions: serializedSubmissions });
  } catch (error) {
    console.error('GET /api/download-gates/[id]/submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
