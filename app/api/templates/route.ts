import { UseCaseFactory } from '@/lib/di-container';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, createdResponse } from '@/lib/api-response';
import { CreateEmailTemplateSchema } from '@/lib/validation-schemas';

export const GET = withErrorHandler(async () => {
  const requestId = generateRequestId();
  const useCase = UseCaseFactory.createGetEmailTemplatesUseCase();
  const templates = await useCase.execute({});

  return successResponse(
    {
      templates: templates.map(t => t.toJSON()),
      count: templates.length
    },
    200,
    requestId
  );
});

export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const body = await request.json();

  // Validate request body
  const validation = CreateEmailTemplateSchema.safeParse(body);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.error.format())}`);
  }

  const useCase = UseCaseFactory.createCreateEmailTemplateUseCase();
  const template = await useCase.execute(validation.data);

  return createdResponse(
    {
      template: template.toJSON(),
      success: true
    },
    requestId
  );
});
