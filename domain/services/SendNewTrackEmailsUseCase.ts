/**
 * SendNewTrackEmailsUseCase
 *
 * Orchestrates sending new track emails to all subscribed contacts.
 * Handles batch email sending, error collection, and execution logging.
 *
 * Clean Architecture: Business logic in domain layer.
 * SOLID: Single Responsibility (orchestrates newsletter sending),
 *        Dependency Inversion (depends on interfaces).
 */

import { IContactRepository } from '../repositories/IContactRepository';
import { IEmailProvider, EmailParams } from '../../infrastructure/email/IEmailProvider';
import { ITrackRepository, Track } from '../repositories/ITrackRepository';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';
import { IUserRepository } from '../repositories/IUserRepository';

export interface SendNewTrackEmailsInput {
  userId: number;
  track: Track;
  emailHtml: string;
  subject: string;
  baseUrl: string;
}

export interface SendNewTrackEmailsResult {
  success: boolean;
  sent: number;
  failed: number;
  totalSubscribers: number;
}

export class SendNewTrackEmailsUseCase {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly emailProvider: IEmailProvider,
    private readonly trackRepository: ITrackRepository,
    private readonly executionLogRepository: IExecutionLogRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: SendNewTrackEmailsInput): Promise<SendNewTrackEmailsResult> {
    const startTime = Date.now();

    console.log('[SendNewTrackEmailsUseCase] START:', {
      userId: input.userId,
      trackId: input.track.trackId,
      trackTitle: input.track.title,
      subject: input.subject,
    });

    // 1. Fetch user to get custom sender email configuration
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error(`User not found: ${input.userId}`);
    }

    // Extract domain from baseUrl for default sender
    const defaultDomain = input.baseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const senderEmail = user.getFormattedSenderEmail(defaultDomain);

    console.log('[SendNewTrackEmailsUseCase] Sender configuration:', {
      hasCustomSender: user.hasCustomSender(),
      senderEmail,
      userId: input.userId,
    });

    // 2. Fetch all subscribed contacts
    const contacts = await this.contactRepository.getSubscribed(input.userId);
    console.log('[SendNewTrackEmailsUseCase] Fetched contacts:', contacts.length);

    if (contacts.length === 0) {
      console.log('[SendNewTrackEmailsUseCase] No subscribers, skipping send');
      // Log execution even if no subscribers
      await this.executionLogRepository.create({
        newTracks: 1,
        emailsSent: 0,
        durationMs: Date.now() - startTime,
        trackId: input.track.trackId,
        trackTitle: input.track.title,
      });

      return {
        success: true,
        sent: 0,
        failed: 0,
        totalSubscribers: 0,
      };
    }

    // 3. Send emails in batch (parallel execution)
    const emailPromises = contacts.map(async (contact) => {
      const unsubscribeUrl = `${input.baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;

      const emailParams: EmailParams = {
        from: senderEmail, // Use custom sender if configured
        to: contact.email,
        subject: input.subject,
        html: input.emailHtml,
        unsubscribeUrl,
        tags: [
          { name: 'category', value: 'new_track' },
          { name: 'track_id', value: input.track.trackId },
        ],
      };

      try {
        const result = await this.emailProvider.send(emailParams);

        if (!result.success) {
          console.error(`[SendNewTrackEmailsUseCase] Email failed for ${contact.email}:`, result.error);
        }

        return { success: result.success, email: contact.email, error: result.error };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SendNewTrackEmailsUseCase] Exception sending to ${contact.email}:`, errorMessage);
        return { success: false, email: contact.email, error: errorMessage };
      }
    });

    // Wait for all emails to complete
    const results = await Promise.all(emailPromises);

    // 4. Count successes and failures
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log('[SendNewTrackEmailsUseCase] Results:', {
      sent,
      failed,
      total: contacts.length,
      senderEmail,
      firstFailureReason: results.find((r) => !r.success)?.error
    });

    // 5. Save track to database
    await this.trackRepository.save(input.track, input.userId);

    // 6. Log execution
    await this.executionLogRepository.create({
      newTracks: 1,
      emailsSent: sent,
      durationMs: Date.now() - startTime,
      trackId: input.track.trackId,
      trackTitle: input.track.title,
    });

    return {
      success: true,
      sent,
      failed,
      totalSubscribers: contacts.length,
    };
  }
}
