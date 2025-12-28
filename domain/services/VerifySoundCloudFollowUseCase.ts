/**
 * VerifySoundCloudFollowUseCase
 *
 * Verifies that a user follows a SoundCloud artist.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate submission exists and is not already verified
 * - Get gate's soundcloud_user_id (artist to follow)
 * - Call SoundCloud API to verify follow exists
 * - Update submission.soundcloud_follow_verified = true + timestamp
 * - Track analytics event (verify_follow)
 * - Return verification result
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (SoundCloud follow verification)
 * - DIP: Depends on repository interfaces and SoundCloud client
 *
 * OAuth Flow:
 * 1. User submits email
 * 2. User authenticates with SoundCloud
 * 3. This use case verifies the follow requirement
 * 4. If verified, user can download
 */

import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';
import { IDownloadGateRepository } from '../repositories/IDownloadGateRepository';
import { IDownloadAnalyticsRepository } from '../repositories/IDownloadAnalyticsRepository';
import { SoundCloudClient } from '@/lib/soundcloud-client';

export interface VerifySoundCloudFollowInput {
  submissionId: number;
  accessToken: string;
  soundcloudUserId: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifySoundCloudFollowResult {
  success: boolean;
  verified?: boolean;
  error?: string;
}

export class VerifySoundCloudFollowUseCase {
  constructor(
    private readonly submissionRepository: IDownloadSubmissionRepository,
    private readonly gateRepository: IDownloadGateRepository,
    private readonly analyticsRepository: IDownloadAnalyticsRepository,
    private readonly soundCloudClient: SoundCloudClient
  ) {}

  /**
   * Execute follow verification
   * @param input - Verification data (submission ID, access token, user ID)
   * @returns Verification result
   */
  async execute(input: VerifySoundCloudFollowInput): Promise<VerifySoundCloudFollowResult> {
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
      if (submission.soundcloudFollowVerified) {
        return {
          success: true,
          verified: true,
        };
      }

      // 3. Get gate to find required artist user ID
      const gate = await this.gateRepository.findById(1, submission.gateId.toString());
      if (!gate) {
        return {
          success: false,
          error: 'Gate not found',
        };
      }

      // 4. Validate gate requires follow
      if (!gate.requireSoundcloudFollow || !gate.soundcloudUserId) {
        return {
          success: false,
          error: 'Gate does not require SoundCloud follow',
        };
      }

      // 5. Check follow via SoundCloud API
      const isFollowing = await this.soundCloudClient.checkFollow(
        input.accessToken,
        gate.soundcloudUserId,
        input.soundcloudUserId
      );

      if (!isFollowing) {
        return {
          success: true,
          verified: false,
        };
      }

      // 6. Update submission verification status
      await this.submissionRepository.updateVerificationStatus(input.submissionId, {
        soundcloudFollowVerified: true,
      });

      // 7. Track analytics event
      await this.trackVerifyFollowEvent(gate.id, input);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      console.error('VerifySoundCloudFollowUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify follow',
      };
    }
  }

  /**
   * Track verify_follow analytics event
   * Non-critical: Failure doesn't affect verification result
   * @param gateId - Gate ID
   * @param input - Verification input
   */
  private async trackVerifyFollowEvent(
    gateId: string,
    input: VerifySoundCloudFollowInput
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
      console.error('Failed to track verify_follow event (non-critical):', error);
    }
  }
}
