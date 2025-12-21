import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailOpenedEvent implements IEmailEvent {
  readonly type = 'opened' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    // Update email_logs with opened timestamp and increment count
    await this.repository.updateEmailLogOpened(data.emailLogId);

    // Record event
    await this.repository.create({
      emailLogId: data.emailLogId,
      contactId: data.contactId,
      trackId: data.trackId,
      eventType: this.type,
      eventData: {},
      resendEmailId: data.emailId
    });
  }
}
