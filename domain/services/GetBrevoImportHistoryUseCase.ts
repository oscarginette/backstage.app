/**
 * GetBrevoImportHistoryUseCase
 *
 * Retrieves Brevo import history for a user.
 * Clean Architecture + SOLID compliant.
 *
 * Business Logic:
 * - Fetches import history records for the authenticated user
 * - Returns records sorted by date (newest first)
 * - Limits results to prevent overwhelming the UI
 */

import type {
  IBrevoImportHistoryRepository,
  BrevoImportHistory
} from '@/domain/repositories/IBrevoImportHistoryRepository';

/**
 * Input for fetching import history
 */
export interface GetBrevoImportHistoryInput {
  userId: number;
  limit?: number;
}

/**
 * Result of import history fetch
 */
export interface GetBrevoImportHistoryResult {
  success: boolean;
  error?: string;
  imports?: Array<{
    id: number;
    contactsFetched: number;
    contactsInserted: number;
    contactsUpdated: number;
    contactsSkipped: number;
    listsProcessed: number;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    duration: number | null;
    error: string | null;
  }>;
}

/**
 * Use Case for fetching Brevo import history
 *
 * SRP: Single responsibility - fetch import history
 * DIP: Depends on interface, not concrete implementation
 */
export class GetBrevoImportHistoryUseCase {
  constructor(
    private brevoImportHistoryRepo: IBrevoImportHistoryRepository
  ) {}

  /**
   * Execute fetch operation
   *
   * @param input - Fetch parameters (userId, optional limit)
   * @returns Import history records
   */
  async execute(input: GetBrevoImportHistoryInput): Promise<GetBrevoImportHistoryResult> {
    try {
      const limit = input.limit || 10;

      // Fetch import history from repository
      const imports = await this.brevoImportHistoryRepo.findByUserId(
        input.userId,
        limit
      );

      // Transform to response format
      return {
        success: true,
        imports: imports.map(this.transformImportRecord)
      };

    } catch (error: unknown) {
      console.error('[GetBrevoImportHistoryUseCase] Error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: 'Failed to fetch import history',
        imports: []
      };
    }
  }

  /**
   * Transform import history record to response format
   *
   * Converts domain entity to API response format
   *
   * @param record - Import history record from repository
   * @returns Formatted import record
   */
  private transformImportRecord(record: BrevoImportHistory) {
    return {
      id: record.id,
      contactsFetched: record.contactsFetched,
      contactsInserted: record.contactsInserted,
      contactsUpdated: record.contactsUpdated,
      contactsSkipped: record.contactsSkipped,
      listsProcessed: record.listsProcessed,
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      duration: record.durationMs,
      error: record.errorMessage
    };
  }
}
