/**
 * IEmailSignatureRepository
 *
 * Repository interface for email signature persistence.
 * Follows Dependency Inversion Principle (domain depends on interface).
 */

import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export interface IEmailSignatureRepository {
  /**
   * Get user's email signature
   * @returns EmailSignature or null if not configured
   */
  findByUserId(userId: number): Promise<EmailSignature | null>;

  /**
   * Create or update user's email signature
   */
  upsert(userId: number, signature: EmailSignature): Promise<void>;

  /**
   * Delete user's email signature (revert to default)
   */
  delete(userId: number): Promise<void>;
}
