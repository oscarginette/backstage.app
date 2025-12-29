import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailDelayedEvent implements IEmailEvent {
  readonly type = 'delayed' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    // Record event (delay events don't have specific metadata fields in EmailEventMetadata)
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
