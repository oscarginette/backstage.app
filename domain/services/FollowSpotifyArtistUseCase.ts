/**
 * FollowSpotifyArtistUseCase
 *
 * Handles following a Spotify artist when a fan connects their Spotify account.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Check if user is already following the artist (idempotent)
 * - Follow the artist using Spotify API
 * - Update submission record with follow status
 * - Track follow completion timestamp
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (artist following)
 * - DIP: Depends on repository interface and SpotifyClient
 *
 * Security:
 * - Uses access token from OAuth (already validated)
 * - Non-blocking: submission succeeds even if follow fails
 */

import { SpotifyClient } from '@/lib/spotify-client';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';

export interface FollowSpotifyArtistInput {
  submissionId: string; // UUID
  accessToken: string; // Spotify OAuth access token
  artistSpotifyId: string; // Artist's Spotify ID to follow
}

export interface FollowSpotifyArtistResult {
  success: boolean;
  error?: string;
  alreadyFollowing?: boolean;
}

export class FollowSpotifyArtistUseCase {
  constructor(
    private readonly spotifyClient: SpotifyClient,
    private readonly submissionRepository: IDownloadSubmissionRepository
  ) {}

  /**
   * Execute artist follow operation
   * @param input - Follow artist data
   * @returns FollowSpotifyArtistResult with success status
   */
  async execute(input: FollowSpotifyArtistInput): Promise<FollowSpotifyArtistResult> {
    try {
      // 1. Check if already following (idempotent operation)
      const [isFollowing] = await this.spotifyClient.checkIfFollowing(input.accessToken, [
        input.artistSpotifyId,
      ]);

      if (isFollowing) {
        // Already following - still update our record
        await this.submissionRepository.updateSpotifyFollowStatus(input.submissionId, true);

        return {
          success: true,
          alreadyFollowing: true,
        };
      }

      // 2. Follow artist
      await this.spotifyClient.followArtist(input.accessToken, input.artistSpotifyId);

      // 3. Update submission record
      await this.submissionRepository.updateSpotifyFollowStatus(input.submissionId, true);

      return {
        success: true,
        alreadyFollowing: false,
      };
    } catch (error) {
      console.error('FollowSpotifyArtistUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to follow artist',
      };
    }
  }
}
