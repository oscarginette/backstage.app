/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel tracking configuration for a download gate
 *
 * Clean Architecture: API route only orchestrates, business logic in use case.
 * Security: Requires authentication, verifies gate ownership.
 */

import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError, UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface UpdatePixelConfigBody {
  pixelConfig: {
    facebook?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
      testEventCode?: string;
    };
    google?: {
      enabled: boolean;
      tagId: string;
      conversionLabels?: {
        view?: string;
        submit?: string;
        download?: string;
      };
    };
    tiktok?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
  };
}

/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel configuration for a gate
 */
async function handlePatch(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();

  // Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError('Authentication required');
  }

  const { id: gateId } = await context!.params;
  const userId = parseInt(session.user.id);

  // Parse request body
  const body: UpdatePixelConfigBody = await request.json();

  // Execute use case
  const useCase = UseCaseFactory.createUpdatePixelConfigUseCase();
  const result = await useCase.execute({
    userId,
    gateId,
    pixelConfig: body.pixelConfig,
  });

  return successResponse(result, 200, requestId);
}

export const PATCH = withErrorHandler(handlePatch);
