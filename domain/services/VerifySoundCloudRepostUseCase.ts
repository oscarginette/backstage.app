/**
 * VerifySoundCloudRepostUseCase
 *
 * Verifies that a user has reposted a SoundCloud track.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate submission exists and is not already verified
 * - Get gate's soundcloud_track_id
 * - Call SoundCloud API to verify repost exists
 * - Update submission.soundcloud_repost_verified = true + timestamp
 * - Track analytics event (verify_repost)
 * - Return verification result
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (SoundCloud repost verification)
 * - DIP: Depends on repository interfaces and SoundCloud client
 *
 * OAuth Flow:
 * 1. User submits email
 * 2. User authenticates with SoundCloud
 * 3. This use case verifies the repost requirement
 * 4. If verified, user can download
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { SoundCloudClient } from '@/lib/soundcloud-client';

export interface VerifySoundCloudRepostInput {
  submissionId: number;
  accessToken: string;
  soundcloudUserId: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifySoundCloudRepostResult {
  success: boolean;
  verified?: boolean;
  error?: string;
}

export class VerifySoundCloudRepostUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly soundCloudClient: SoundCloudClient
  ) {}

  /**
   * Execute repost verification
   * @param input - Verification data (submission ID, access token, user ID)
   * @returns Verification result
   */
  async execute(input: VerifySoundCloudRepostInput): Promise<VerifySoundCloudRepostResult> {
    try {
      // 1. Find submission
      const submission = await this.submissionRepository.findById(input.submissionId);
      if (!submission) {
        return {
          success: false,
          error: 'Submission not found',
        };
      }

      // 2. Check if already verified (idempotent)
      if (submission.soundcloudRepostVerified) {
        return {
          success: true,
          verified: true,
        };
      }

      // 3. Get gate to find required track ID
      const gate = await this.gateRepository.findById(1, submission.gateId.toString());
      if (!gate) {
        return {
          success: false,
          error: 'Gate not found',
        };
      }

      // 4. Validate gate requires repost
      if (!gate.requireSoundcloudRepost || !gate.soundcloudTrackId) {
        return {
          success: false,
          error: 'Gate does not require SoundCloud repost',
        };
      }

      // 5. Check repost via SoundCloud API
      const hasReposted = await this.soundCloudClient.checkRepost(
        input.accessToken,
        gate.soundcloudTrackId,
        input.soundcloudUserId
      );

      if (!hasReposted) {
        return {
          success: true,
          verified: false,
        };
      }

      // 6. Update submission verification status
      await this.submissionRepository.updateVerificationStatus(input.submissionId, {
        soundcloudRepostVerified: true,
      });

      // 7. Track analytics event
      await this.trackVerifyRepostEvent(gate.id, input);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      console.error('VerifySoundCloudRepostUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify repost',
      };
    }
  }

  /**
   * Track verify_repost analytics event
   * Non-critical: Failure doesn't affect verification result
   * @param gateId - Gate ID
   * @param input - Verification input
   */
  private async trackVerifyRepostEvent(
    gateId: string,
    input: VerifySoundCloudRepostInput
  ): Promise<void> {
    try {
      await this.analyticsRepository.track({
        gateId: gateId,
        eventType: 'submit', // Using 'submit' as base type (extend EventType if needed)
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (error) {
      // Non-critical error: verification succeeds even if analytics tracking fails
      console.error('Failed to track verify_repost event (non-critical):', error);
    }
  }
}
