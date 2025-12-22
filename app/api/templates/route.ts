import { NextResponse } from 'next/server';
import { CreateEmailTemplateUseCase } from '@/domain/services/email-templates/CreateEmailTemplateUseCase';
import { GetEmailTemplatesUseCase } from '@/domain/services/email-templates/GetEmailTemplatesUseCase';
import { PostgresEmailTemplateRepository } from '@/infrastructure/database/repositories/PostgresEmailTemplateRepository';

const emailTemplateRepository = new PostgresEmailTemplateRepository();

export async function GET() {
  try {
    const useCase = new GetEmailTemplatesUseCase(emailTemplateRepository);
    const result = await useCase.execute({});
    return NextResponse.json({
      templates: result.templates.map(t => t.toJSON()),
      count: result.count
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const useCase = new CreateEmailTemplateUseCase(emailTemplateRepository);
    const result = await useCase.execute(body);
    return NextResponse.json({ template: result.template.toJSON(), success: result.success }, { status: 201 });
  } catch (error: any) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
