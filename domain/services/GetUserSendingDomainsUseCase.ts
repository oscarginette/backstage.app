/**
 * GetUserSendingDomainsUseCase
 *
 * Retrieves all sending domains for a user.
 * Simple use case for listing domains in settings UI.
 *
 * Returns:
 * - All domains owned by user (newest first)
 * - Includes pending, verified, and failed domains
 * - Used by settings page to display domain list
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (fetch user domains)
 * - OCP: Open for extension (easy to add filtering/sorting)
 * - LSP: Works with any ISendingDomainRepository implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */

import { ISendingDomainRepository } from '../repositories/ISendingDomainRepository';
import { SendingDomain } from '../entities/SendingDomain';

/**
 * GetUserSendingDomainsUseCase
 *
 * Simple use case for fetching user's domains.
 * No complex business logic, just data retrieval.
 */
export class GetUserSendingDomainsUseCase {
  constructor(
    private readonly sendingDomainRepository: ISendingDomainRepository
  ) {}

  /**
   * Execute domain retrieval
   *
   * @param userId - User ID to fetch domains for
   * @returns List of domains (newest first)
   *
   * Example:
   * const domains = await useCase.execute(123);
   * console.log(`User has ${domains.length} domains`);
   */
  async execute(userId: number): Promise<SendingDomain[]> {
    try {
      console.log('[GetUserSendingDomains] Fetching domains for user:', userId);

      const domains = await this.sendingDomainRepository.findByUserId(userId);

      console.log('[GetUserSendingDomains] Found domains:', {
        userId,
        count: domains.length,
        domains: domains.map(d => ({
          id: d.id,
          domain: d.domain,
          status: d.status,
        })),
      });

      return domains;
    } catch (error) {
      console.error('[GetUserSendingDomains] Error fetching domains:', error);

      // Return empty array on error (graceful degradation)
      // UI will show "No domains" instead of error
      return [];
    }
  }
}
