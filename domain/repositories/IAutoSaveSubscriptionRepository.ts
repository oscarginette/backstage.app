/**
 * IAutoSaveSubscriptionRepository Interface
 *
 * Defines the contract for auto-save subscription data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation (PostgreSQL)
 *
 * Subscriptions track fans who opted into automatic release saving.
 */

import { AutoSaveSubscription } from '../entities/AutoSaveSubscription';

export interface CreateSubscriptionInput {
  submissionId: string;
  spotifyUserId: string;
  artistUserId: number;
  artistSpotifyId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: Date;
  nextCheckAt: Date;
}

export interface TokenUpdate {
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiresAt: Date;
}

/**
 * Repository interface for AutoSaveSubscription
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface IAutoSaveSubscriptionRepository {
  /**
   * Create a new auto-save subscription
   * @param input - Subscription creation data
   * @returns Subscription ID (UUID)
   */
  create(input: CreateSubscriptionInput): Promise<string>;

  /**
   * Find subscription by ID
   * @param id - Subscription UUID
   * @returns Subscription or null if not found
   */
  findById(id: string): Promise<AutoSaveSubscription | null>;

  /**
   * Find all active subscriptions due for checking
   * Used by cron job to process subscriptions
   * @returns Array of subscriptions that need checking
   */
  findDueForCheck(): Promise<AutoSaveSubscription[]>;

  /**
   * Update OAuth tokens (after refresh)
   * @param id - Subscription UUID
   * @param tokens - Updated token data
   */
  updateTokens(id: string, tokens: TokenUpdate): Promise<void>;

  /**
   * Update last check timestamp
   * Used after processing subscription
   * @param id - Subscription UUID
   * @param timestamp - Check timestamp
   */
  updateLastCheck(id: string, timestamp: Date): Promise<void>;

  /**
   * Deactivate subscription (user opt-out)
   * @param id - Subscription UUID
   */
  deactivate(id: string): Promise<void>;

  /**
   * Find subscription by Spotify user and artist
   * Used to prevent duplicate subscriptions
   * @param spotifyUserId - Fan's Spotify user ID
   * @param artistSpotifyId - Artist's Spotify ID
   * @returns Subscription or null if not found
   */
  findByUserAndArtist(
    spotifyUserId: string,
    artistSpotifyId: string
  ): Promise<AutoSaveSubscription | null>;
}
