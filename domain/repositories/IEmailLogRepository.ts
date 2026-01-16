export interface EmailLog {
  id?: number;
  userId?: number;  // Added for multi-tenant tracking
  contactId: number;
  campaignId?: string;  // Added for campaign tracking (warmup, drafts)
  trackId?: string;  // Made optional (campaigns don't use trackId)
  resendEmailId?: string | null;
  status: 'sent' | 'failed' | 'delivered' | 'bounced' | 'opened' | 'clicked';
  error?: string | null;
  sentAt?: Date;  // Added for explicit sent timestamp
  createdAt?: string;
}

export interface IEmailLogRepository {
  create(log: Omit<EmailLog, 'id' | 'createdAt'>): Promise<void>;
  findByTrackId(trackId: string): Promise<EmailLog[]>;
  updateStatus(resendEmailId: string, status: EmailLog['status']): Promise<void>;
}
