import { UseCaseFactory } from '@/lib/di-container';
import { auth } from '@/lib/auth';
import { DeleteContactsSchema } from '@/lib/validation-schemas';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contacts/delete
 * Deletes multiple contacts by IDs for authenticated user
 *
 * Clean Architecture: Only HTTP concerns (parsing, error handling, JSON response)
 * Business logic delegated to DeleteContactsUseCase
 * Multi-tenant: Only deletes contacts belonging to authenticated user
 */
export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const userId = parseInt(session.user.id);

  const body = await request.json();

  // Validate request body
  const validation = DeleteContactsSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.format());
  }

  // Get use case from factory (DI)
  const useCase = UseCaseFactory.createDeleteContactsUseCase();
  const result = await useCase.execute({ ids: validation.data.ids, userId });

  return successResponse(
    {
      success: result.success,
      deleted: result.deleted,
    },
    200,
    requestId
  );
});
