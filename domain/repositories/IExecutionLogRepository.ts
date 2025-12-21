export interface ExecutionLog {
  id?: number;
  newTracks?: number;
  emailsSent?: number;
  durationMs?: number;
  trackId?: string | null;
  trackTitle?: string | null;
  error?: string | null;
  createdAt?: string;
}

export interface IExecutionLogRepository {
  create(log: Omit<ExecutionLog, 'id' | 'createdAt'>): Promise<void>;
  findRecent(limit: number): Promise<ExecutionLog[]>;
}
