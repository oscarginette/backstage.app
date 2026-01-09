/**
 * GetListContactsUseCase
 *
 * Retrieves all contacts in a specific contact list.
 * Follows Clean Architecture + SOLID principles.
 */

import { IContactListRepository } from '../repositories/IContactListRepository';
import { Contact } from '../entities/Contact';

export class GetListContactsUseCase {
  constructor(private contactListRepository: IContactListRepository) {}

  /**
   * Execute use case
   * @param listId - ID of the contact list
   * @param userId - ID of the user (for multi-tenant isolation)
   * @returns Array of Contact objects in the list
   */
  async execute(listId: string, userId: number): Promise<Contact[]> {
    return this.contactListRepository.getContactsByListId(listId, userId);
  }
}
