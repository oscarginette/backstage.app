/**
 * POST /api/gate/[slug]/submit
 * Submit email for download gate (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic in use cases.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { serializeSubmission } from '@/lib/serialization';
import { SubmitDownloadGateSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gate/[slug]/submit
 * Submit email and create download submission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Parse and validate request body
    const body = await request.json();

    const validation = SubmitDownloadGateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, firstName, consentMarketing } = validation.data;

    // Extract IP and user agent for GDPR compliance
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Initialize use case
    const submitEmailUseCase = UseCaseFactory.createSubmitEmailUseCase();

    // Execute
    // Note: userId is derived from the gate owner, not passed here
    const result = await submitEmailUseCase.execute({
      gateSlug: slug,
      email,
      firstName,
      consentMarketing,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Serialize submission
    const serializedSubmission = serializeSubmission(result.submission!);

    return NextResponse.json(
      { submission: serializedSubmission },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/gate/[slug]/submit error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
