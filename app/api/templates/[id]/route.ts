import { NextResponse } from 'next/server';
import { GetEmailTemplatesUseCase } from '@/domain/services/email-templates/GetEmailTemplatesUseCase';
import { UpdateEmailTemplateUseCase } from '@/domain/services/email-templates/UpdateEmailTemplateUseCase';
import { DeleteEmailTemplateUseCase } from '@/domain/services/email-templates/DeleteEmailTemplateUseCase';
import { PostgresEmailTemplateRepository } from '@/infrastructure/database/repositories/PostgresEmailTemplateRepository';

const emailTemplateRepository = new PostgresEmailTemplateRepository();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const useCase = new GetEmailTemplatesUseCase(emailTemplateRepository);
    const template = await useCase.getById(id);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ template: template.toJSON() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const useCase = new UpdateEmailTemplateUseCase(emailTemplateRepository);
    const result = await useCase.execute({ id: id, ...body });
    return NextResponse.json({ template: result.template.toJSON(), isNewVersion: result.isNewVersion });
  } catch (error: any) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const useCase = new DeleteEmailTemplateUseCase(emailTemplateRepository);
    const result = await useCase.execute({ id: id });
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.name === 'ValidationError' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
