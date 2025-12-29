import type { EmailEventMetadata } from '../types/metadata';

export interface EmailEventRecord {
  emailLogId: number;
  contactId: number;
  trackId: string;
  eventType: string;
  eventData: EmailEventMetadata;
  resendEmailId: string;
}

export interface IEmailEventRepository {
  create(event: EmailEventRecord): Promise<void>;
  updateEmailLogDelivered(logId: number): Promise<void>;
  updateEmailLogOpened(logId: number): Promise<void>;
  updateEmailLogClicked(logId: number, url: string): Promise<void>;
  updateEmailLogBounced(logId: number, reason: string): Promise<void>;
  findEmailLogByResendId(resendEmailId: string): Promise<{id: number; contact_id: number; track_id: string} | null>;
}
