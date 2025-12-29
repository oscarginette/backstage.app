/**
 * GET /api/download-gates/[id]
 * Get download gate by ID (authenticated)
 *
 * PATCH /api/download-gates/[id]
 * Update download gate
 *
 * DELETE /api/download-gates/[id]
 * Delete download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { serializeGate, serializeGateWithStats } from '@/lib/serialization';
import { UpdateDownloadGateSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates/[id]
 * Returns gate by ID for authenticated user with stats
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

    // Get use cases from factory (DI)
    const getGateUseCase = UseCaseFactory.createGetDownloadGateUseCase();
    const getStatsUseCase = UseCaseFactory.createGetGateStatsUseCase();

    // Execute
    const gate = await getGateUseCase.executeById({ userId, gateId: id });

    if (!gate) {
      return NextResponse.json(
        { error: 'Gate not found or access denied' },
        { status: 404 }
      );
    }

    // Get stats
    const statsResult = await getStatsUseCase.execute({ userId, gateId: id });

    if (!statsResult.success || !statsResult.stats) {
      return NextResponse.json(
        { error: statsResult.error || 'Failed to retrieve stats' },
        { status: 500 }
      );
    }

    // Map domain stats to frontend format
    const frontendStats = {
      views: statsResult.stats.totalViews,
      submissions: statsResult.stats.totalSubmissions,
      downloads: statsResult.stats.totalDownloads,
      conversionRate: statsResult.stats.conversionRate,
      soundcloudReposts: statsResult.stats.soundcloudReposts,
      soundcloudFollows: statsResult.stats.soundcloudFollows,
      spotifyConnections: statsResult.stats.spotifyConnects,
    };

    // Serialize gate with stats
    const serializedGate = {
      ...serializeGate(gate),
      stats: frontendStats
    };

    return NextResponse.json({ gate: serializedGate });
  } catch (error) {
    console.error('GET /api/download-gates/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/download-gates/[id]
 * Update download gate
 */
export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json();

    const validation = UpdateDownloadGateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get use case from factory (DI)
    const updateGateUseCase = UseCaseFactory.createUpdateDownloadGateUseCase();

    // Execute with validated data
    const result = await updateGateUseCase.execute(userId, id, validation.data);

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

    // Serialize gate
    const serializedGate = serializeGate(result.gate!);

    return NextResponse.json({ gate: serializedGate });
  } catch (error) {
    console.error('PATCH /api/download-gates/[id] error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/download-gates/[id]
 * Delete download gate
 */
export async function DELETE(
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
    const deleteGateUseCase = UseCaseFactory.createDeleteDownloadGateUseCase();

    // Execute
    const result = await deleteGateUseCase.execute(userId, id);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/download-gates/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
