/**
 * GET /api/download-gates
 * List all download gates for authenticated user
 *
 * POST /api/download-gates
 * Create new download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { serializeGate, serializeGateWithStats } from '@/lib/serialization';
import { CreateDownloadGateSchema } from '@/lib/validation-schemas';
import { isAppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/download-gates
 * Returns all gates for authenticated user with stats
 */
export async function GET(request: Request) {
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

    // Get use case from factory (DI)
    const listGatesUseCase = UseCaseFactory.createListDownloadGatesUseCase();

    // Execute
    const gatesWithStats = await listGatesUseCase.execute(userId);

    // Serialize dates to ISO strings
    const serializedGates = gatesWithStats.map(({ gate, stats }) => {
      // Map the use case stats to frontend format (without "total" prefix)
      const gateStats = {
        views: stats.totalViews,
        submissions: stats.totalSubmissions,
        downloads: stats.totalDownloads,
        conversionRate: stats.conversionRate,
        soundcloudReposts: stats.soundcloudReposts || 0,
        soundcloudFollows: stats.soundcloudFollows || 0,
        spotifyConnections: stats.spotifyConnects || 0,
      };
      return {
        ...serializeGate(gate),
        stats: gateStats
      };
    });

    return NextResponse.json({ gates: serializedGates });
  } catch (error) {
    console.error('GET /api/download-gates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download-gates
 * Create new download gate
 */
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();

    const validation = CreateDownloadGateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get use case from factory (DI)
    const createGateUseCase = UseCaseFactory.createCreateDownloadGateUseCase();

    // Execute with validated data
    const result = await createGateUseCase.execute(userId, validation.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Serialize gate
    const serializedGate = serializeGate(result.gate!);

    return NextResponse.json(
      { gate: serializedGate },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/download-gates error:', error);

    // Handle known AppError types with proper status codes
    if (isAppError(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: error.status }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
