/**
 * ListFilterCriteria Value Object
 *
 * Represents filtering criteria for contact list selection in email campaigns.
 * Immutable value object following Clean Architecture principles.
 */

export const LIST_FILTER_MODES = {
  ALL_CONTACTS: 'all_contacts',
  SPECIFIC_LISTS: 'specific_lists',
  EXCLUDE_LISTS: 'exclude_lists',
} as const;

export type ListFilterMode =
  (typeof LIST_FILTER_MODES)[keyof typeof LIST_FILTER_MODES];

export class ListFilterCriteria {
  constructor(
    public readonly mode: ListFilterMode,
    public readonly listIds: string[]
  ) {
    this.validate();
  }

  /**
   * Validates business rules for list filtering
   */
  private validate(): void {
    const validModes = Object.values(LIST_FILTER_MODES);

    if (!validModes.includes(this.mode)) {
      throw new Error(`Invalid filter mode: ${this.mode}`);
    }

    if (
      this.mode === LIST_FILTER_MODES.SPECIFIC_LISTS &&
      this.listIds.length === 0
    ) {
      throw new Error('SPECIFIC_LISTS mode requires at least one list ID');
    }
  }

  /**
   * Checks if filter represents "all contacts" mode
   */
  isAllContacts(): boolean {
    return this.mode === LIST_FILTER_MODES.ALL_CONTACTS;
  }

  /**
   * Factory method for "all contacts" filter
   */
  static allContacts(): ListFilterCriteria {
    return new ListFilterCriteria(LIST_FILTER_MODES.ALL_CONTACTS, []);
  }

  /**
   * Factory method for "specific lists" filter
   */
  static specificLists(listIds: string[]): ListFilterCriteria {
    return new ListFilterCriteria(LIST_FILTER_MODES.SPECIFIC_LISTS, listIds);
  }

  /**
   * Factory method for "exclude lists" filter
   */
  static excludeLists(listIds: string[]): ListFilterCriteria {
    return new ListFilterCriteria(LIST_FILTER_MODES.EXCLUDE_LISTS, listIds);
  }
}
