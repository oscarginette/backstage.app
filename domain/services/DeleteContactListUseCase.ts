/**
 * DeleteContactListUseCase
 *
 * Deletes a contact list with validation.
 * Follows Single Responsibility Principle (SOLID).
 */

import type { IContactListRepository } from '../repositories/IContactListRepository';

export class DeleteContactListUseCase {
  constructor(private listRepository: IContactListRepository) {}

  async execute(input: { userId: number; listId: string }): Promise<void> {
    // Validate that list exists before deleting
    const list = await this.listRepository.findById(input.listId, input.userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    // Delete list (cascade deletes list members via ON DELETE CASCADE)
    await this.listRepository.delete(input.listId, input.userId);
  }
}
