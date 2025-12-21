export interface IEmailEvent {
  readonly type: EmailEventType;
  process(data: WebhookEventData): Promise<void>;
}

export type EmailEventType = 'sent' | 'delivered' | 'delayed' | 'bounced' | 'opened' | 'clicked';

export interface WebhookEventData {
  emailId: string;
  emailLogId: number;
  contactId: number;
  trackId: string;
  data: any;
}
