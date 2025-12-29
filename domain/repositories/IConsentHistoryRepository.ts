/**
 * IConsentHistoryRepository
 *
 * Interface for consent history data access (Dependency Inversion Principle)
 */

import { ConsentHistory, ConsentAction, ConsentSource } from '../entities/ConsentHistory';
import type { ConsentHistoryMetadata } from '../types/metadata';

export interface CreateConsentHistoryInput {
  contactId: number;
  action: ConsentAction;
  timestamp: Date;
  source: ConsentSource;
  ipAddress: string | null;
  userAgent: string | null;
  metadata?: ConsentHistoryMetadata | null;
}

export interface IConsentHistoryRepository {
  /**
   * Create a new consent history record
   */
  create(input: CreateConsentHistoryInput): Promise<ConsentHistory>;

  /**
   * Find all consent history for a contact
   */
  findByContactId(contactId: number): Promise<ConsentHistory[]>;

  /**
   * Find consent history by action type
   */
  findByAction(action: ConsentAction, limit?: number): Promise<ConsentHistory[]>;

  /**
   * Get recent unsubscribes (for analysis)
   */
  getRecentUnsubscribes(days: number): Promise<ConsentHistory[]>;

  /**
   * Get consent timeline for a contact (ordered by timestamp)
   */
  getContactTimeline(contactId: number): Promise<ConsentHistory[]>;

  /**
   * Count actions by type
   */
  countByAction(action: ConsentAction, startDate?: Date, endDate?: Date): Promise<number>;
}
