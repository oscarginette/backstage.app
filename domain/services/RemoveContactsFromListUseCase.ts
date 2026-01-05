/**
 * RemoveContactsFromListUseCase
 *
 * Removes contacts from a list with validation.
 * Follows Single Responsibility Principle (SOLID).
 */

import type { IContactListRepository } from '../repositories/IContactListRepository';

export class RemoveContactsFromListUseCase {
  constructor(private listRepository: IContactListRepository) {}

  async execute(input: {
    userId: number;
    listId: string;
    contactIds: number[];
  }): Promise<{ success: boolean; removedCount: number }> {
    // Validate that the list exists and belongs to the user
    const list = await this.listRepository.findById(input.listId, input.userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    const removedCount = await this.listRepository.removeContacts(
      input.listId,
      input.contactIds
    );

    return { success: true, removedCount };
  }
}
