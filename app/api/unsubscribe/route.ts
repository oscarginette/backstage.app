import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Unsubscribe Endpoint (Clean Architecture)
 *
 * Accepts both GET and POST (CAN-SPAM compliant 1-click unsubscribe)
 * Query params: ?token=xxx
 *
 * Features:
 * - Token validation
 * - Idempotent (can call multiple times)
 * - GDPR audit trail logging
 * - IP and User-Agent tracking
 * - Comprehensive error handling
 */

async function handleUnsubscribe(request: Request) {
  const requestId = generateRequestId();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Validate token parameter
  if (!token) {
    throw new ValidationError('Missing unsubscribe token');
  }

  // Extract IP and User-Agent for audit trail (GDPR compliance)
  const ipAddress =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    null;
  const userAgent = request.headers.get('user-agent') || null;

  // Execute use case (business logic)
  const useCase = UseCaseFactory.createUnsubscribeUseCase();
  const result = await useCase.execute({
    token,
    ipAddress,
    userAgent,
  });

  // Handle use case result
  if (!result.success) {
    throw new NotFoundError(result.error || 'Invalid unsubscribe token');
  }

  // Return success response
  return successResponse(
    {
      message: result.alreadyUnsubscribed
        ? 'Already unsubscribed'
        : 'Successfully unsubscribed',
      email: result.email,
    },
    200,
    requestId
  );
}

export const GET = withErrorHandler(handleUnsubscribe);
export const POST = withErrorHandler(handleUnsubscribe);
