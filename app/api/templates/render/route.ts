import { NextResponse } from 'next/server';
import { RenderTemplateWithDataUseCase } from '@/domain/services/email-templates/RenderTemplateWithDataUseCase';
import { emailTemplateRepository } from '@/infrastructure/database/repositories';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    if (!body.data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    const useCase = new RenderTemplateWithDataUseCase(emailTemplateRepository);
    const result = await useCase.execute({
      templateId: body.templateId,
      data: body.data
    });

    return NextResponse.json({
      html: result.html,
      subject: result.subject
    });
  } catch (error: any) {
    console.error('Error rendering template:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to render template' },
      { status: 500 }
    );
  }
}
