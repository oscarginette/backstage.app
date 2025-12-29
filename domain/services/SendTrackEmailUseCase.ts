/**
 * SendTrackEmailUseCase
 *
 * Sends tracked email with quota enforcement.
 * Handles quota checking, email sending, and quota increment.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion (depends on interfaces).
 * GDPR: Tracks email sending for audit trail.
 */

import { IEmailProvider } from '../providers/IEmailProvider';
import { IQuotaTrackingRepository } from '../repositories/IQuotaTrackingRepository';
import { QuotaExceededError, ValidationError, NotFoundError } from '@/lib/errors';

export interface SendTrackEmailInput {
  userId: number;
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendTrackEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  quotaRemaining: number;
}

export class SendTrackEmailUseCase {
  constructor(
    private readonly emailProvider: IEmailProvider,
    private readonly quotaRepository: IQuotaTrackingRepository
  ) {}

  async execute(input: SendTrackEmailInput): Promise<SendTrackEmailResult> {
    // Validate input
    this.validateInput(input);

    // Check quota BEFORE sending
    const quota = await this.quotaRepository.getByUserId(input.userId);

    if (!quota) {
      throw new NotFoundError(`Quota tracking not found for user ${input.userId}`);
    }

    // Reset if new day
    if (quota.needsReset()) {
      await this.quotaRepository.resetDailyCount(input.userId);
    } else {
      // Check if quota exceeded
      if (!quota.canSendEmail()) {
        throw new QuotaExceededError(
          `Daily email limit reached (${quota.monthlyLimit}). Quota resets tomorrow.`
        );
      }
    }

    // Send email
    const emailResult = await this.emailProvider.send({
      to: input.to,
      subject: input.subject,
      html: input.html,
      from: input.from,
      replyTo: input.replyTo,
      headers: input.headers,
    });

    // Only increment quota if email sent successfully
    if (emailResult.success) {
      await this.quotaRepository.incrementEmailCount(input.userId);
    }

    // Get updated quota
    const updatedQuota = await this.quotaRepository.getByUserId(input.userId);
    const remaining = updatedQuota ? updatedQuota.getRemainingQuota() : 0;

    return {
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error,
      quotaRemaining: remaining,
    };
  }

  private validateInput(input: SendTrackEmailInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.to || !this.isValidEmail(input.to)) {
      throw new ValidationError('Invalid recipient email address');
    }

    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject cannot be empty');
    }

    if (!input.html || input.html.trim().length === 0) {
      throw new ValidationError('Email body cannot be empty');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
