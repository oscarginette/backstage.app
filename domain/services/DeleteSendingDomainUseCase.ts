/**
 * DeleteSendingDomainUseCase
 *
 * Handles deletion of a sending domain.
 * Removes domain from both Mailgun and database.
 *
 * Flow:
 * 1. Fetch domain by ID
 * 2. Verify user ownership (security check)
 * 3. Delete from Mailgun (optional - preserves stats if kept)
 * 4. Delete from database
 * 5. Return success
 *
 * Security:
 * - Ownership verification (prevent unauthorized deletion)
 * - User can only delete their own domains
 *
 * Mailgun Deletion Policy:
 * - Optional: Keep in Mailgun for stats/logs retention
 * - Default: Delete from Mailgun to avoid hitting 1000 domain limit
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (delete domain)
 * - OCP: Open for extension (easy to add soft-delete)
 * - LSP: Works with any ISendingDomainRepository/IMailgunClient implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */

import { ISendingDomainRepository } from '../repositories/ISendingDomainRepository';
import { IMailgunClient } from '../providers/IMailgunClient';

export interface DeleteSendingDomainInput {
  domainId: number;
  userId: number; // For ownership verification
}

export interface DeleteSendingDomainResult {
  success: boolean;
  error?: string;
}

/**
 * DeleteSendingDomainUseCase
 *
 * Business logic for deleting artist-owned domains.
 * Orchestrates Mailgun deletion and database cleanup.
 */
export class DeleteSendingDomainUseCase {
  constructor(
    private readonly sendingDomainRepository: ISendingDomainRepository,
    private readonly mailgunClient: IMailgunClient
  ) {}

  /**
   * Execute domain deletion
   *
   * @param input - Domain ID and user ID for ownership verification
   * @returns Success/failure result
   *
   * Example:
   * const result = await useCase.execute({
   *   domainId: 123,
   *   userId: 456
   * });
   */
  async execute(
    input: DeleteSendingDomainInput
  ): Promise<DeleteSendingDomainResult> {
    try {
      // 1. Fetch domain by ID
      const domain = await this.sendingDomainRepository.findById(input.domainId);
      if (!domain) {
        console.log('[DeleteSendingDomain] Domain not found:', input.domainId);
        return { success: false, error: 'Domain not found' };
      }

      console.log('[DeleteSendingDomain] Deleting domain:', {
        id: domain.id,
        domain: domain.domain,
        userId: input.userId,
        ownerId: domain.userId,
      });

      // 2. Verify ownership (security check)
      if (domain.userId !== input.userId) {
        console.error('[DeleteSendingDomain] Unauthorized deletion attempt:', {
          domainId: domain.id,
          requestingUserId: input.userId,
          ownerUserId: domain.userId,
        });
        return {
          success: false,
          error: 'Unauthorized. You can only delete your own domains.',
        };
      }

      // 3. Delete from Mailgun (if exists)
      // NOTE: This is optional - you can keep domains in Mailgun for stats/logs
      // However, deleting helps avoid hitting Mailgun's 1000 domain limit
      if (domain.mailgunDomainName) {
        console.log('[DeleteSendingDomain] Deleting from Mailgun:', domain.mailgunDomainName);

        try {
          await this.mailgunClient.deleteDomain(domain.mailgunDomainName);
          console.log('[DeleteSendingDomain] Mailgun deletion successful');
        } catch (mailgunError) {
          // Don't fail the entire operation if Mailgun deletion fails
          // Domain might already be deleted from Mailgun manually
          console.warn('[DeleteSendingDomain] Mailgun deletion failed (continuing anyway):', mailgunError);
        }
      } else {
        console.log('[DeleteSendingDomain] No Mailgun domain name, skipping Mailgun deletion');
      }

      // 4. Delete from database
      console.log('[DeleteSendingDomain] Deleting from database:', domain.id);
      await this.sendingDomainRepository.delete(domain.id);

      console.log('[DeleteSendingDomain] Domain deleted successfully:', {
        id: domain.id,
        domain: domain.domain,
      });

      // 5. Return success
      return { success: true };
    } catch (error) {
      console.error('[DeleteSendingDomain] Unexpected error:', error);

      // Don't expose internal errors to user
      return {
        success: false,
        error: 'Failed to delete domain. Please try again later.',
      };
    }
  }
}
