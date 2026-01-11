/**
 * SendTrackEmailUseCase
 *
 * Sends tracked email with quota enforcement.
 * Handles quota checking, email sending, and quota increment.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility, Dependency Inversion (depends on interfaces).
 * GDPR: Tracks email sending for audit trail.
 *
 * TRANSACTION SAFETY (CRITICAL):
 * This use case uses transactions to prevent financial loss:
 *
 * Problem: If email sends successfully but incrementEmailCount() fails,
 * the user gets a free email (quota not incremented) -> financial loss.
 *
 * Solution: Transaction pattern:
 * 1. BEGIN transaction
 * 2. Lock quota row (FOR UPDATE)
 * 3. Verify quota INSIDE transaction (with lock)
 * 4. Increment quota BEFORE sending email
 * 5. Send email (if this fails, rollback restores quota)
 * 6. COMMIT (both quota increment and email send succeeded)
 *
 * This ensures atomicity: either both succeed or both fail (rollback).
 */

import * as Sentry from '@sentry/nextjs';
import { IEmailProvider } from '../providers/IEmailProvider';
import { IQuotaTrackingRepository } from '../repositories/IQuotaTrackingRepository';
import { QuotaExceededError, ValidationError, NotFoundError } from '@/lib/errors';
import { withTransaction } from '@/lib/db-transaction-helper';
import { Email } from '../value-objects/Email';

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
    // Start Sentry span for performance monitoring
    return await Sentry.startSpan(
      {
        op: 'use-case',
        name: 'SendTrackEmailUseCase',
      },
      async () => {
        try {
          // Validate input
          this.validateInput(input);

          // Add context for debugging (without sensitive data)
          Sentry.setContext('email_send', {
            userId: input.userId,
            hasSubject: !!input.subject,
            hasHtml: !!input.html,
            timestamp: new Date().toISOString(),
          });

      // Execute email sending within a transaction
      // This ensures atomicity: quota increment + email send happen together
      // If email fails, quota increment is rolled back (prevents financial loss)
      const result = await withTransaction(async (tx) => {
      // 1. Lock quota row to prevent race conditions
      // FOR UPDATE ensures no other transaction can modify this row
      // until we COMMIT or ROLLBACK
      const quota = await this.quotaRepository.getByUserIdWithLock(input.userId, tx);

      if (!quota) {
        throw new NotFoundError(`Quota tracking not found for user ${input.userId}`);
      }

      // 2. Reset if new day (inside transaction)
      if (quota.needsReset()) {
        await this.quotaRepository.resetDailyCountInTransaction(input.userId, tx);
        // After reset, quota is 0, so we can send
      } else {
        // 3. Check if quota exceeded (with locked row)
        if (!quota.canSendEmail()) {
          throw new QuotaExceededError(
            `Daily email limit reached (${quota.monthlyLimit}). Quota resets tomorrow.`
          );
        }
      }

      // 4. CRITICAL: Increment quota BEFORE sending email
      // If email send fails, transaction will rollback and restore quota
      // This prevents "free emails" due to quota increment failures
      await this.quotaRepository.incrementEmailCountInTransaction(input.userId, tx);

      // 5. Send email AFTER incrementing quota
      // If this fails, the entire transaction (including quota increment) is rolled back
      const emailResult = await this.emailProvider.send({
        to: input.to,
        subject: input.subject,
        html: input.html,
        from: input.from,
        replyTo: input.replyTo,
        headers: input.headers,
      });

      // 6. Verify email was sent successfully
      if (!emailResult.success) {
        // Throw error to trigger rollback
        // Quota increment will be rolled back automatically
        throw new Error(emailResult.error || 'Email sending failed');
      }

      // 7. Get updated quota to return remaining count
      const updatedQuota = await this.quotaRepository.getByUserIdWithLock(input.userId, tx);
      const remaining = updatedQuota ? updatedQuota.getRemainingQuota() : 0;

      return {
        success: true,
        messageId: emailResult.messageId,
        quotaRemaining: remaining,
      };
    });

          return result;
        } catch (error) {
          // Capture error to Sentry with context
          Sentry.captureException(error, {
            tags: {
              useCase: 'SendTrackEmail',
              userId: input.userId.toString(),
            },
            extra: {
              // Sanitized input (no email content)
              userId: input.userId,
              hasSubject: !!input.subject,
              subjectLength: input.subject?.length || 0,
              htmlLength: input.html?.length || 0,
            },
          });
          throw error;
        }
      }
    );
  }

  private validateInput(input: SendTrackEmailInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.to || !Email.isValid(input.to)) {
      throw new ValidationError('Invalid recipient email address');
    }

    if (!input.subject || input.subject.trim().length === 0) {
      throw new ValidationError('Subject cannot be empty');
    }

    if (!input.html || input.html.trim().length === 0) {
      throw new ValidationError('Email body cannot be empty');
    }
  }
}
