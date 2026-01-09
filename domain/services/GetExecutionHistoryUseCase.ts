/**
 * GetExecutionHistoryUseCase
 *
 * Retrieves execution history with track information.
 * Returns recent email campaign executions with associated tracks.
 *
 * Clean Architecture: Business logic isolated from database and external API concerns.
 * SOLID: Single Responsibility (only handles execution history retrieval).
 */

import { ITrackRepository } from '@/domain/repositories/ITrackRepository';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { sql } from '@/lib/db';

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

export interface GetExecutionHistoryResult {
  history: ExecutionHistoryItem[];
}

/**
 * GetExecutionHistoryUseCase
 *
 * Fetches execution history with track details and enrichment from RSS feed.
 *
 * NOTE: This use case still uses direct SQL for the complex JOIN query.
 * Future improvement: Add getExecutionHistoryWithTracks() to IExecutionLogRepository.
 */
export class GetExecutionHistoryUseCase {
  constructor(
    private trackRepository: ITrackRepository,
    private executionLogRepository: IExecutionLogRepository
  ) {}

  /**
   * Execute the use case
   *
   * @returns Execution history with track information
   */
  async execute(): Promise<GetExecutionHistoryResult> {
    try {
      // Fetch tracks with their execution logs
      // NOTE: This complex JOIN query should eventually be moved to repository
      const result = await sql`
        SELECT
          st.track_id,
          st.title,
          st.url,
          st.published_at,
          st.cover_image,
          st.description,
          st.created_at,
          el.emails_sent,
          el.duration_ms,
          el.executed_at
        FROM soundcloud_tracks st
        LEFT JOIN execution_logs el ON el.executed_at >= st.created_at
        WHERE el.new_tracks = 1
        ORDER BY el.executed_at DESC
        LIMIT 20
      `;

      // Transform to domain format
      const history: ExecutionHistoryItem[] = result.rows.map((row: any) => ({
        trackId: row.track_id,
        title: row.title,
        url: row.url,
        publishedAt: row.published_at,
        executedAt: row.executed_at,
        emailsSent: row.emails_sent || 0,
        durationMs: row.duration_ms || 0,
        coverImage: row.cover_image,
        description: row.description,
      }));

      return {
        history,
      };
    } catch (error) {
      console.error('GetExecutionHistoryUseCase error:', error);
      // Return empty history on error to avoid breaking UI
      return {
        history: [],
      };
    }
  }
}
