import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailDelayedEvent implements IEmailEvent {
  readonly type = 'delayed' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    const reason = data.data?.reason;

    // Record event with delay reason
    await this.repository.create({
      emailLogId: data.emailLogId,
      contactId: data.contactId,
      trackId: data.trackId,
      eventType: this.type,
      eventData: { reason },
      resendEmailId: data.emailId
    });
  }
}
