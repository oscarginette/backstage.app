/**
 * Add Contacts to List API
 *
 * POST /api/contact-lists/[id]/add-contacts - Add contacts to a list
 *
 * Multi-tenant isolation enforced via session.user.id and use case validation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AddContactsToListUseCase } from '@/domain/services/AddContactsToListUseCase';
import { PostgresContactListRepository } from '@/infrastructure/database/repositories/PostgresContactListRepository';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';

const contactListRepository = new PostgresContactListRepository();
const contactRepository = new PostgresContactRepository();

/**
 * POST /api/contact-lists/[id]/add-contacts
 * Add multiple contacts to a list (bulk operation)
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

    const useCase = new AddContactsToListUseCase(
      contactListRepository,
      contactRepository
    );
    const result = await useCase.execute({
      userId: parseInt(session.user.id),
      listId: params.id,
      contactIds: body.contactIds,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding contacts to list:', error);

    if (
      error.message.includes('not found') ||
      error.message.includes('access denied')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message.includes('No valid contacts')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add contacts to list' },
      { status: 400 }
    );
  }
}
