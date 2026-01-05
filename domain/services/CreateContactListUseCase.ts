/**
 * CreateContactListUseCase
 *
 * Handles creation of custom contact lists with quota enforcement.
 * Follows Single Responsibility Principle (SOLID).
 */

import { LIST_LIMITS } from '../types/list-colors';
import type { ContactList } from '../entities/ContactList';
import type { IContactListRepository } from '../repositories/IContactListRepository';

export class CreateContactListUseCase {
  constructor(private listRepository: IContactListRepository) {}

  async execute(input: {
    userId: number;
    name: string;
    description?: string;
    color: string;
  }): Promise<ContactList> {
    await this.validateInput(input);

    return await this.listRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color,
      metadata: {},
    });
  }

  private async validateInput(input: any): Promise<void> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('List name is required');
    }

    if (input.name.length > LIST_LIMITS.MAX_NAME_LENGTH) {
      throw new Error(
        `List name cannot exceed ${LIST_LIMITS.MAX_NAME_LENGTH} characters`
      );
    }

    // Check list count limit (quota enforcement)
    const currentCount = await this.listRepository.countByUserId(input.userId);
    if (currentCount >= LIST_LIMITS.MAX_LISTS_PER_USER) {
      throw new Error(
        `You have reached the maximum limit of ${LIST_LIMITS.MAX_LISTS_PER_USER} lists`
      );
    }
  }
}
