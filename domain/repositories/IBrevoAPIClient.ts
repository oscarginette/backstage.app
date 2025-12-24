/**
 * IBrevoAPIClient Interface
 *
 * Dependency Inversion Principle: Domain layer depends on this interface,
 * not on the concrete Brevo SDK implementation.
 *
 * This allows:
 * - Easy testing with mock implementations
 * - Swapping Brevo for another email service provider
 * - Zero coupling to external SDK in domain layer
 */

export interface BrevoList {
  id: number;
  name: string;
  totalSubscribers?: number;
}

export interface BrevoContact {
  id: number;
  email: string;
  emailBlacklisted: boolean;
  listIds: number[];
  attributes: Record<string, any>;
}

export interface IBrevoAPIClient {
  /**
   * Fetch all available contact lists from Brevo account
   * @returns Array of Brevo lists with metadata
   */
  getLists(): Promise<BrevoList[]>;

  /**
   * Fetch contacts from all lists in the Brevo account
   * Handles pagination, deduplication, and rate limiting automatically
   *
   * @param options.limit - Optional limit for preview mode (e.g., 500 contacts)
   * @returns Array of unique contacts (deduplicated by email)
   */
  getContactsFromAllLists(options?: {
    limit?: number;
  }): Promise<BrevoContact[]>;
}
