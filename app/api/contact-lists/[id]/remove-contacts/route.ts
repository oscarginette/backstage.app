/**
 * Remove Contacts from List API
 *
 * POST /api/contact-lists/[id]/remove-contacts - Remove contacts from a list
 *
 * Multi-tenant isolation enforced via session.user.id and use case validation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RemoveContactsFromListUseCase } from '@/domain/services/RemoveContactsFromListUseCase';
import { PostgresContactListRepository } from '@/infrastructure/database/repositories/PostgresContactListRepository';

const contactListRepository = new PostgresContactListRepository();

/**
 * POST /api/contact-lists/[id]/remove-contacts
 * Remove multiple contacts from a list (bulk operation)
 *
 * Request body: { contactIds: number[] }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const useCase = new RemoveContactsFromListUseCase(contactListRepository);
    const result = await useCase.execute({
      userId: parseInt(session.user.id),
      listId: params.id,
      contactIds: body.contactIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error removing contacts from list:', error);

    if (
      error.message.includes('not found') ||
      error.message.includes('access denied')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove contacts from list' },
      { status: 400 }
    );
  }
}
