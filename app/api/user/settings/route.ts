/**
 * GET/PATCH /api/user/settings
 *
 * Handles user settings retrieval and updates.
 * Clean Architecture: Only HTTP orchestration, no business logic.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GetUserSettingsUseCase } from '@/domain/services/GetUserSettingsUseCase';
import { UpdateUserSettingsUseCase, ValidationError } from '@/domain/services/UpdateUserSettingsUseCase';
import { PostgresUserSettingsRepository } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';
import { NotFoundError } from '@/infrastructure/database/repositories/PostgresUserSettingsRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/settings
 * Retrieve authenticated user's settings
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const repository = new PostgresUserSettingsRepository();
    const useCase = new GetUserSettingsUseCase(repository);

    const settings = await useCase.execute(parseInt(session.user.id));

    return NextResponse.json({
      settings: settings.toJSON()
    });

  } catch (error: any) {
    console.error('Error fetching user settings:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/settings
 * Update authenticated user's settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const repository = new PostgresUserSettingsRepository();
    const useCase = new UpdateUserSettingsUseCase(repository);

    const settings = await useCase.execute(parseInt(session.user.id), {
      name: body.name,
      soundcloudId: body.soundcloudId,
      spotifyId: body.spotifyId
    });

    return NextResponse.json({
      settings: settings.toJSON()
    });

  } catch (error: any) {
    console.error('Error updating user settings:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
