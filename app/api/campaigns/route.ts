import { GetCampaignsUseCase } from '@/domain/services/campaigns/GetCampaignsUseCase';
import { CreateCampaignUseCase } from '@/domain/services/campaigns/CreateCampaignUseCase';
import { emailCampaignRepository } from '@/infrastructure/database/repositories';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, createdResponse } from '@/lib/api-response';
import { CreateCampaignSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * List all email campaigns
 *
 * Query parameters:
 * - status: 'draft' | 'sent' (optional) - Filter by campaign status
 * - trackId: string (optional) - Filter by track ID
 * - templateId: string (optional) - Filter by template ID
 * - scheduledOnly: boolean (optional) - Only return scheduled campaigns
 */
export const GET = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'draft' | 'sent' | null;
  const trackId = searchParams.get('trackId');
  const templateId = searchParams.get('templateId');
  const scheduledOnly = searchParams.get('scheduledOnly') === 'true';

  const useCase = new GetCampaignsUseCase(emailCampaignRepository);
  const result = await useCase.execute({
    status: status || undefined,
    trackId: trackId || undefined,
    templateId: templateId || undefined,
    scheduledOnly
  });

  return successResponse(
    {
      campaigns: result.campaigns,
      count: result.count
    },
    200,
    requestId
  );
});

/**
 * POST /api/campaigns
 * Create a new email campaign or draft
 *
 * Body:
 * - templateId: string (optional) - Template to base campaign on
 * - trackId: string (optional) - Track to link campaign to
 * - subject: string (required) - Campaign subject
 * - htmlContent: string (required) - Campaign HTML content
 * - status: 'draft' | 'sent' (optional, default: 'draft') - Initial status
 * - scheduledAt: string (optional) - ISO date string for scheduled sending
 */
export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const body = await request.json();

  // Validate request body
  const validation = CreateCampaignSchema.safeParse(body);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.error.format())}`);
  }

  const validatedData = validation.data;

  const useCase = new CreateCampaignUseCase(emailCampaignRepository);
  const result = await useCase.execute({
    templateId: validatedData.templateId,
    trackId: validatedData.trackId,
    subject: validatedData.subject,
    htmlContent: validatedData.htmlContent,
    status: validatedData.status,
    scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null
  });

  return createdResponse(
    {
      campaign: result.campaign,
      success: result.success
    },
    requestId
  );
});
