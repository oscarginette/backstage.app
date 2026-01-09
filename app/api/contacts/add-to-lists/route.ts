/**
 * Add Contacts to Multiple Lists API
 *
 * POST /api/contacts/add-to-lists - Add contacts to multiple lists simultaneously
 *
 * Multi-tenant isolation enforced via session.user.id and use case validation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * POST /api/contacts/add-to-lists
 * Add contacts to multiple lists (bulk operation)
 *
 * Request body: {
 *   contactIds: number[],
 *   listIds: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    if (!Array.isArray(body.contactIds) || body.contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.listIds) || body.listIds.length === 0) {
      return NextResponse.json(
        { error: 'listIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const useCase = UseCaseFactory.createAddContactsToMultipleListsUseCase();

    const result = await useCase.execute({
      userId: parseInt(session.user.id),
      listIds: body.listIds,
      contactIds: body.contactIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding contacts to lists:', error);

    if (error.message.includes('No valid contacts')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add contacts to lists' },
      { status: 400 }
    );
  }
}
