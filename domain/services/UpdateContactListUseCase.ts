/**
 * UpdateContactListUseCase
 *
 * Updates contact list properties with validation.
 * Follows Single Responsibility Principle (SOLID).
 */

import { LIST_LIMITS } from '../types/list-colors';
import type { ContactList } from '../entities/ContactList';
import type {
  IContactListRepository,
  UpdateContactListInput,
} from '../repositories/IContactListRepository';

export class UpdateContactListUseCase {
  constructor(private listRepository: IContactListRepository) {}

  async execute(input: {
    userId: number;
    listId: string;
    name?: string;
    description?: string | null;
    color?: string;
  }): Promise<ContactList> {
    const updateData: UpdateContactListInput = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length === 0) {
        throw new Error('List name cannot be empty');
      }
      if (trimmedName.length > LIST_LIMITS.MAX_NAME_LENGTH) {
        throw new Error(
          `List name cannot exceed ${LIST_LIMITS.MAX_NAME_LENGTH} characters`
        );
      }
      updateData.name = trimmedName;
    }

    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null;
    }

    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    return await this.listRepository.update(
      input.listId,
      input.userId,
      updateData
    );
  }
}
