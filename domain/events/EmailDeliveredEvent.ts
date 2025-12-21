import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailDeliveredEvent implements IEmailEvent {
  readonly type = 'delivered' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    // Update email_logs with delivered timestamp
    await this.repository.updateEmailLogDelivered(data.emailLogId);

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
