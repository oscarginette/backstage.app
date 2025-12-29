import { UseCaseFactory } from '@/lib/di-container';
import { auth } from '@/lib/auth';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contacts
 * Obtiene todos los contactos con estadísticas del usuario autenticado
 *
 * Clean Architecture: Only HTTP orchestration, no business logic
 * Multi-tenant: Returns only contacts belonging to authenticated user
 */
export const GET = withErrorHandler(async () => {
  const requestId = generateRequestId();

  // Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const userId = parseInt(session.user.id);

  // Get use case from factory (DI)
  const useCase = UseCaseFactory.createGetContactsWithStatsUseCase();

  const result = await useCase.execute(userId);

  return successResponse(result, 200, requestId);
});
