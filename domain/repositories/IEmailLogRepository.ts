export interface EmailLog {
  id?: number;
  contactId: number;
  trackId: string;
  resendEmailId?: string | null;
  status: 'sent' | 'failed' | 'delivered' | 'bounced' | 'opened' | 'clicked';
  error?: string | null;
  createdAt?: string;
}

export interface IEmailLogRepository {
  create(log: Omit<EmailLog, 'id' | 'createdAt'>): Promise<void>;
  findByTrackId(trackId: string): Promise<EmailLog[]>;
  updateStatus(resendEmailId: string, status: EmailLog['status']): Promise<void>;
}
