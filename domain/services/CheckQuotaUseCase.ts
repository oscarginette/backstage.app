/**
 * CheckQuotaUseCase
 *
 * Checks if user can send email based on quota limits.
 * Handles automatic daily reset if needed.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (only checks quota), Dependency Inversion (depends on interface).
 */

import { IQuotaTrackingRepository } from '../repositories/IQuotaTrackingRepository';

export interface CheckQuotaInput {
  userId: number;
}

export interface CheckQuotaResult {
  allowed: boolean;
  remaining: number;
  emailsSentToday: number;
  monthlyLimit: number;
  resetDate: Date;
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class CheckQuotaUseCase {
  constructor(private readonly quotaRepository: IQuotaTrackingRepository) {}

  async execute(input: CheckQuotaInput): Promise<CheckQuotaResult> {
    // Validate input
    if (!input.userId || input.userId <= 0) {
      throw new Error('Invalid userId');
    }

    // Get quota tracking
    const quota = await this.quotaRepository.getByUserId(input.userId);

    if (!quota) {
      throw new Error(`Quota tracking not found for user ${input.userId}`);
    }

    // Check if daily reset is needed
    if (quota.needsReset()) {
      await this.quotaRepository.resetDailyCount(input.userId);

      // Return fresh quota status
      return {
        allowed: true,
        remaining: quota.monthlyLimit,
        emailsSentToday: 0,
        monthlyLimit: quota.monthlyLimit,
        resetDate: new Date(),
      };
    }

    // Check if user can send
    const allowed = quota.canSendEmail();
    const remaining = quota.getRemainingQuota();

    return {
      allowed,
      remaining,
      emailsSentToday: quota.emailsSentToday,
      monthlyLimit: quota.monthlyLimit,
      resetDate: quota.lastResetDate,
    };
  }
}
