export interface ExecutionHistoryItem {
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  executedAt: string;
  emailsSent: number;
  durationMs: number;
  coverImage: string | null;
  description: string | null;
}

export interface SoundCloudTrack {
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  coverImage: string | null;
  description: string | null;
  alreadySent: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  greeting: string;
  message: string;
  signature: string;
  type: 'track' | 'custom';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  templateId: string | null;
  trackId: string | null;
  subject: string;
  htmlContent: string;
  status: 'draft' | 'sent';
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailContent {
  subject: string;
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  listFilter?: {
    mode: string;
    listIds: string[];
  };
}
