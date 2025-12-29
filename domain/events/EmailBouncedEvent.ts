import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailBouncedEvent implements IEmailEvent {
  readonly type = 'bounced' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    const bounceType = data.data?.bounce_type || 'unknown';
    const reason = data.data?.reason || 'No reason provided';

    // Update email_logs with error message
    await this.repository.updateEmailLogBounced(data.emailLogId, `Bounced: ${bounceType} - ${reason}`);

    // Record event with bounce details
    await this.repository.create({
      emailLogId: data.emailLogId,
      contactId: data.contactId,
      trackId: data.trackId,
      eventType: this.type,
      eventData: {
        bounceType: bounceType as 'hard' | 'soft' | 'spam',
        bounceReason: reason
      },
      resendEmailId: data.emailId
    });
  }
}
