import { IEmailEvent, WebhookEventData } from './IEmailEvent';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';

export class EmailClickedEvent implements IEmailEvent {
  readonly type = 'clicked' as const;

  constructor(private readonly repository: IEmailEventRepository) {}

  async process(data: WebhookEventData): Promise<void> {
    const clickedUrl = data.data?.url || 'unknown';

    // Update email_logs with clicked timestamp, increment count, and add URL
    await this.repository.updateEmailLogClicked(data.emailLogId, clickedUrl);

    // Record event with URL in event data
    await this.repository.create({
      emailLogId: data.emailLogId,
      contactId: data.contactId,
      trackId: data.trackId,
      eventType: this.type,
      eventData: { clickedUrl },
      resendEmailId: data.emailId
    });
  }
}
