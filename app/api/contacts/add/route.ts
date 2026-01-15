import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import { CreateContactSchema } from '@/lib/validation-schemas';

/**
 * POST /api/contacts/add
 *
 * Creates a single contact manually with validation and GDPR consent logging.
 *
 * Orchestration Layer (Clean Architecture):
 * - Authenticates user
 * - Validates request body
 * - Extracts IP address and user agent
 * - Executes CreateContactUseCase
 * - Returns results
 *
 * Dependency Injection:
 * - Instantiates use case via factory
 * - Injects repositories into use case
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = CreateContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, name, subscribed, metadata } = validation.data;

    // 3. Extract IP address and user agent for GDPR compliance
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
    const userAgent = request.headers.get('user-agent') || null;

    // 4. Execute CreateContactUseCase with Dependency Injection
    const useCase = UseCaseFactory.createCreateContactUseCase();

    const result = await useCase.execute({
      userId,
      email,
      name: name || null,
      subscribed: subscribed ?? true,
      metadata: metadata || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    });

    // 5. Handle result
    if (!result.success) {
      // Duplicate contact error → 409 Conflict
      if (result.error?.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 409 }
        );
      }

      // Validation error → 400 Bad Request
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Success → 200 OK
    return NextResponse.json({
      success: true,
      contact: result.contact,
      action: result.action
    });
  } catch (error: unknown) {
    console.error('[Add Contact] Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    return NextResponse.json(
      {
        error: 'Failed to add contact',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
