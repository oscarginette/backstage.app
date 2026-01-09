/**
 * GET /api/contact-lists/[id]/contacts
 *
 * Get all contacts in a specific contact list.
 * API route only orchestrates - business logic in Use Case.
 * Multi-tenant isolation enforced via session.user.id
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listId } = await params;
    const userId = parseInt(session.user.id);

    // Get use case from DI container
    const useCase = UseCaseFactory.createGetListContactsUseCase();

    // Execute use case
    const contacts = await useCase.execute(listId, userId);

    // Serialize contacts to plain objects (Email value object → string)
    const serializedContacts = contacts.map((contact) => ({
      id: contact.id,
      email: contact.email.toString(),
      unsubscribeToken: contact.unsubscribeToken,
      subscribed: contact.subscribed,
      name: contact.name,
      createdAt: contact.createdAt,
    }));

    return NextResponse.json({ contacts: serializedContacts });
  } catch (error: any) {
    console.error('Error fetching list contacts:', error);

    if (error.message === 'List not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
