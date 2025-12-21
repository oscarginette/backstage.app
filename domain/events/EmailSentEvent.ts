import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailSentEvent implements IEmailEvent {
  readonly type = 'sent' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
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
