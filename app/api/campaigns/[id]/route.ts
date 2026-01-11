import { GetCampaignUseCase } from '@/domain/services/campaigns/GetCampaignUseCase';
import { UpdateCampaignUseCase } from '@/domain/services/campaigns/UpdateCampaignUseCase';
import { DeleteCampaignUseCase } from '@/domain/services/campaigns/DeleteCampaignUseCase';
import { emailCampaignRepository } from '@/infrastructure/database/repositories';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, noContentResponse } from '@/lib/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/[id]
 * Get a specific email campaign by ID
 */
async function handleGet(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const { id } = await context!.params;
  const requestId = generateRequestId();

  const useCase = new GetCampaignUseCase(emailCampaignRepository);
  const campaign = await useCase.execute(id);

  if (!campaign) {
    throw new NotFoundError('Campaign not found', { id });
  }

  return successResponse({ campaign }, 200, requestId);
}

export const GET = withErrorHandler(handleGet);

/**
 * PUT /api/campaigns/[id]
 * Update an email campaign
 *
 * Body:
 * - subject: string (optional) - Updated subject
 * - htmlContent: string (optional) - Updated HTML content
 * - status: 'draft' | 'sent' (optional) - Updated status
 * - scheduledAt: string (optional) - Updated schedule (ISO date string)
 *
 * Note: Only draft campaigns can be updated. Sent campaigns are immutable.
 */
async function handlePut(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const { id } = await context!.params;
  const requestId = generateRequestId();
  const body = await request.json();

  const useCase = new UpdateCampaignUseCase(emailCampaignRepository);
  const result = await useCase.execute({
    id,
    subject: body.subject,
    htmlContent: body.htmlContent,
    status: body.status,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    sentAt: body.status === 'sent' ? new Date() : undefined,
  });

  return successResponse(
    {
      campaign: result.campaign,
      success: result.success,
    },
    200,
    requestId
  );
}

export const PUT = withErrorHandler(handlePut);

/**
 * DELETE /api/campaigns/[id]
 * Delete an email campaign
 *
 * Note:
 * - Draft campaigns are hard deleted
 * - Sent campaigns cannot be deleted (returns 400 error)
 */
async function handleDelete(
  request: Request,
  context?: { params: Promise<{ id: string }> }
) {
  const { id} = await context!.params;
  const requestId = generateRequestId();

  const useCase = new DeleteCampaignUseCase(emailCampaignRepository);
  await useCase.execute(id);

  return successResponse(
    {
      success: true,
      message: 'Campaign deleted successfully',
    },
    200,
    requestId
  );
}

export const DELETE = withErrorHandler(handleDelete);
