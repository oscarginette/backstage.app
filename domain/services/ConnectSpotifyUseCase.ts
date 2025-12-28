/**
 * ConnectSpotifyUseCase
 *
 * Handles Spotify OAuth connection for download gate submissions.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate submission exists
 * - Verify submission not already connected to Spotify
 * - Update submission with Spotify profile data
 * - Mark spotify_connected = true with timestamp
 * - Track analytics event (connect_spotify)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (Spotify connection)
 * - DIP: Depends on repository interfaces
 *
 * Security:
 * - Only accepts Spotify user profile data (already verified by OAuth)
 * - No direct access token storage (stateless)
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { SpotifyProfile } from '../types/download-gates';

export interface ConnectSpotifyInput {
  submissionId: string; // UUID
  spotifyProfile: SpotifyProfile;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConnectSpotifyResult {
  success: boolean;
  error?: string;
  alreadyConnected?: boolean;
}

export class ConnectSpotifyUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository
  ) {}

  /**
   * Execute Spotify connection
   * @param input - Spotify connection data
   * @returns ConnectSpotifyResult with success status
   */
  async execute(input: ConnectSpotifyInput): Promise<ConnectSpotifyResult> {
    try {
      // Note: Repository interface expects number but implementation accepts UUID strings
      // TypeScript cast needed due to interface/implementation mismatch
      const submissionId = input.submissionId as unknown as number;

      // 1. Validate submission exists
      const submission = await this.submissionRepository.findById(submissionId);
      if (!submission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      // 2. Check if already connected to Spotify
      if (submission.spotifyConnected) {
        // Idempotent: return success if already connected
        return {
          success: true,
          alreadyConnected: true,
        };
      }

      // 3. Update submission with Spotify profile data
      await this.submissionRepository.updateSpotifyProfile(
        submissionId,
        input.spotifyProfile
      );

      // 4. Mark Spotify as connected
      await this.submissionRepository.updateVerificationStatus(submissionId, {
        spotifyConnected: true,
      });

      // 5. Track analytics event
      await this.trackConnectSpotifyEvent(submission.gateId, input);

      return {
        success: true,
        alreadyConnected: false,
      };
    } catch (error) {
      console.error('ConnectSpotifyUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Spotify',
      };
    }
  }

  /**
   * Track connect_spotify analytics event
   * Note: Analytics currently uses numeric gate IDs
   * @param gateId - Gate ID (string UUID)
   * @param input - Connection input
   */
  private async trackConnectSpotifyEvent(
    gateId: string,
    input: ConnectSpotifyInput
  ): Promise<void> {
    try {
      // Note: Analytics repository expects numeric ID, but submission uses UUID
      // Skip analytics for now until analytics is updated to support UUIDs
      console.log('[Analytics] Spotify connected for gate:', gateId);
    } catch (error) {
      // Non-critical error: connection succeeds even if analytics tracking fails
      console.error('Failed to track connect_spotify event (non-critical):', error);
    }
  }
}
