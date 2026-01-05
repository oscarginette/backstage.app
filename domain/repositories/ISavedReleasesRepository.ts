/**
 * ISavedReleasesRepository Interface
 *
 * Defines the contract for saved releases data access.
 * Following Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer provides concrete implementation (PostgreSQL)
 *
 * Tracks which releases have been automatically saved for each subscription.
 */

import { SavedRelease } from '../entities/SavedRelease';

export interface CreateSavedReleaseInput {
  subscriptionId: string;
  releaseType: string; // 'album' | 'single' | 'compilation'
  spotifyAlbumId: string;
  spotifyTrackIds?: string[];
  albumName: string;
  releaseDate: Date;
  saveStatus?: string; // 'success' | 'failed' | 'partial'
  errorMessage?: string;
}

/**
 * Repository interface for SavedRelease
 * Follows Interface Segregation Principle (ISP): focused, minimal interface
 */
export interface ISavedReleasesRepository {
  /**
   * Record a newly saved release
   * @param input - Release data
   */
  create(input: CreateSavedReleaseInput): Promise<void>;

  /**
   * Get all saved album IDs for a subscription
   * Used to filter out already-saved releases
   * @param subscriptionId - Subscription UUID
   * @returns Array of Spotify album IDs
   */
  getSavedAlbumIds(subscriptionId: string): Promise<string[]>;

  /**
   * Find all saved releases for a subscription
   * Used for analytics/dashboard
   * @param subscriptionId - Subscription UUID
   * @returns Array of saved releases
   */
  findBySubscription(subscriptionId: string): Promise<SavedRelease[]>;

  /**
   * Check if a specific album is already saved
   * @param subscriptionId - Subscription UUID
   * @param albumId - Spotify album ID
   * @returns True if already saved
   */
  isAlreadySaved(subscriptionId: string, albumId: string): Promise<boolean>;
}
