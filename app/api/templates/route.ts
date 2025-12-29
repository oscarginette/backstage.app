import { CreateEmailTemplateUseCase } from '@/domain/services/email-templates/CreateEmailTemplateUseCase';
import { GetEmailTemplatesUseCase } from '@/domain/services/email-templates/GetEmailTemplatesUseCase';
import { PostgresEmailTemplateRepository } from '@/infrastructure/database/repositories/PostgresEmailTemplateRepository';
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, createdResponse } from '@/lib/api-response';
import { CreateEmailTemplateSchema } from '@/lib/validation-schemas';

const emailTemplateRepository = new PostgresEmailTemplateRepository();

export const GET = withErrorHandler(async () => {
  const requestId = generateRequestId();
  const useCase = new GetEmailTemplatesUseCase(emailTemplateRepository);
  const result = await useCase.execute({});

  return successResponse(
    {
      templates: result.templates.map(t => t.toJSON()),
      count: result.count
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

  const useCase = new CreateEmailTemplateUseCase(emailTemplateRepository);
  const result = await useCase.execute(validation.data);

  return createdResponse(
    {
      template: result.template.toJSON(),
      success: result.success
    },
    requestId
  );
});
