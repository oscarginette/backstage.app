/**
 * CheckContactQuotaUseCase
 *
 * Checks if user can add more contacts based on subscription quota.
 * Main pricing metric: max_contacts (from subscription plan).
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (only checks contact quota), Dependency Inversion.
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { ValidationError } from '@/lib/errors';

export interface CheckContactQuotaInput {
  userId: number;
  additionalContacts?: number; // Default: 1 (for single contact addition)
}

export interface CheckContactQuotaResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  upgradeRequired: boolean;
  message?: string;
}

// Re-export QuotaExceededError from lib/errors for backward compatibility
export { QuotaExceededError } from '@/lib/errors';

export class CheckContactQuotaUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly contactRepository: IContactRepository
  ) {}

  async execute(input: CheckContactQuotaInput): Promise<CheckContactQuotaResult> {
    // Validate input
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    const additionalContacts = input.additionalContacts || 1;

    if (additionalContacts < 0) {
      throw new ValidationError('additionalContacts must be non-negative');
    }

    // Get user quota information
    const quotaInfo = await this.userRepository.getQuotaInfo(input.userId);

    // Get current contact count (only subscribed contacts count toward quota)
    const currentCount = await this.contactRepository.countByUserId(input.userId);

    const limit = quotaInfo.maxContacts;

    // Check if subscription has expired
    const now = new Date();
    const hasExpired = quotaInfo.subscriptionExpiresAt && quotaInfo.subscriptionExpiresAt < now;

    if (hasExpired) {
      return {
        allowed: false,
        currentCount,
        limit,
        remaining: 0,
        upgradeRequired: true,
        message: `Your subscription has expired. Please renew your plan to continue adding contacts.`,
      };
    }

    const remaining = Math.max(0, limit - currentCount);
    const wouldExceed = currentCount + additionalContacts > limit;

    let message: string | undefined;

    if (wouldExceed) {
      message = `Contact limit reached (${currentCount}/${limit}). Please upgrade your plan to add more contacts.`;
    }

    return {
      allowed: !wouldExceed,
      currentCount,
      limit,
      remaining,
      upgradeRequired: wouldExceed,
      message,
    };
  }
}
