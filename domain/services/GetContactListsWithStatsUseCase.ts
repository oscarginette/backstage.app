/**
 * GetContactListsWithStatsUseCase
 *
 * Retrieves all contact lists for a user with aggregated statistics.
 * Applies alphabetical sorting as per user preference.
 * Follows Single Responsibility Principle (SOLID).
 */

import type {
  IContactListRepository,
  ContactListWithStats,
} from '../repositories/IContactListRepository';

export class GetContactListsWithStatsUseCase {
  constructor(private listRepository: IContactListRepository) {}

  async execute(userId: number): Promise<ContactListWithStats[]> {
    const lists = await this.listRepository.findByUserIdWithStats(userId);

    // Sort alphabetically (case-insensitive) as per user preference
    return lists.sort((a, b) =>
      a.list.name.toLowerCase().localeCompare(b.list.name.toLowerCase())
    );
  }
}
