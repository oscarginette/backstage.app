import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory, RepositoryFactory } from '@/lib/di-container';

export const maxDuration = 60; // Maximum duration for Vercel serverless functions

/**
 * POST /api/integrations/brevo/import
 *
 * Imports all contacts from the user's Brevo account into their Backstage contacts.
 *
 * Clean Architecture:
 * - Presentation Layer (this route): Authentication, orchestration, HTTP responses
 * - Domain Layer (Use Case): Business logic, validation, import process
 * - Infrastructure Layer (Repositories): Database operations, Brevo API calls
 *
 * GDPR Compliance:
 * - Preserves subscription status from Brevo
 * - Creates audit trail in brevo_import_history
 * - Tracks source of all contacts
 */
export async function POST(request: Request) {
  try {
    // Step 1: Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Step 2: Check if query parameters include preview limit
    const url = new URL(request.url);
    const previewParam = url.searchParams.get('preview');
    const previewLimit = previewParam ? parseInt(previewParam, 10) : undefined;

    // Step 3: Get user's Brevo integration (need API key for client)
    const brevoIntegrationRepo = RepositoryFactory.createBrevoIntegrationRepository();
    const integration = await brevoIntegrationRepo.findByUserId(userId);

    if (!integration) {
      return NextResponse.json(
        { error: 'Brevo integration not found. Please connect your Brevo account first.' },
        { status: 404 }
      );
    }

    // Step 4: Create Brevo API client with encrypted API key
    const brevoClient = UseCaseFactory.createBrevoAPIClient(integration.apiKeyEncrypted);

    // Step 5: Create use case and execute import
    const importUseCase = UseCaseFactory.createImportBrevoContactsUseCase(brevoClient);

    const result = await importUseCase.execute({
      userId,
      previewLimit
    });

    // Step 6: Return appropriate response
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result.import?.errors?.[0] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      import: result.import
    });

  } catch (error: unknown) {
    console.error('[POST /api/integrations/brevo/import] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to import contacts from Brevo', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/brevo/import
 *
 * Returns the import history for the authenticated user.
 *
 * Clean Architecture:
 * - Presentation Layer: Authentication, HTTP responses
 * - Domain Layer: Business logic for fetching history
 * - Infrastructure Layer: Database queries
 */
export async function GET() {
  try {
    // Step 1: Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Step 2: Create use case and fetch import history
    const getHistoryUseCase = UseCaseFactory.createGetBrevoImportHistoryUseCase();

    const result = await getHistoryUseCase.execute({
      userId,
      limit: 10
    });

    // Step 3: Return response
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imports: result.imports
    });

  } catch (error: unknown) {
    console.error('[GET /api/integrations/brevo/import] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch import history', details: errorMessage },
      { status: 500 }
    );
  }
}
