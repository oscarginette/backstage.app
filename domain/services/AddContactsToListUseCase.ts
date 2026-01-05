/**
 * AddContactsToListUseCase
 *
 * Adds contacts to a list with validation and multi-tenant isolation.
 * Follows Single Responsibility Principle (SOLID).
 */

import type { IContactListRepository } from '../repositories/IContactListRepository';
import type { IContactRepository } from '../repositories/IContactRepository';

export class AddContactsToListUseCase {
  constructor(
    private listRepository: IContactListRepository,
    private contactRepository: IContactRepository
  ) {}

  async execute(input: {
    userId: number;
    listId: string;
    contactIds: number[];
  }): Promise<{
    success: boolean;
    addedCount: number;
    skippedCount: number;
  }> {
    // Validate that the list exists and belongs to the user
    const list = await this.listRepository.findById(input.listId, input.userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    // Validate that the contacts belong to the user
    const allContacts = await this.contactRepository.findAll(input.userId);
    const validContactIds = new Set(allContacts.map((c) => c.id));
    const validIds = input.contactIds.filter((id) => validContactIds.has(id));

    if (validIds.length === 0) {
      throw new Error('No valid contacts to add');
    }

    // Add contacts (repository handles duplicates with ON CONFLICT)
    const addedCount = await this.listRepository.addContacts(
      input.listId,
      validIds,
      input.userId
    );

    return {
      success: true,
      addedCount,
      skippedCount: validIds.length - addedCount,
    };
  }
}
