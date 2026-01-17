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
import { ISoundCloudClient } from '@/domain/providers/ISoundCloudClient';
import { ILogger } from '@/infrastructure/logging/Logger';
import {
  validateSubmissionExists,
  validateGateExists,
  validateGateRequiresRepost,
  validateGateHasTrackId,
  SoundCloudValidationError,
} from '@/domain/utils/soundcloud-validation';

export interface VerifySoundCloudRepostInput {
  submissionId: string;
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
    private readonly soundCloudClient: ISoundCloudClient,
    private readonly logger: ILogger
  ) {}

  /**
   * Execute repost verification
   * @param input - Verification data (submission ID, access token, user ID)
   * @returns Verification result
   */
  async execute(input: VerifySoundCloudRepostInput): Promise<VerifySoundCloudRepostResult> {
    try {
      // 1. Validate submission exists
      const submission = await validateSubmissionExists(
        this.submissionRepository,
        input.submissionId
      );

      // 2. Check if already verified (idempotent)
      if (submission.soundcloudRepostVerified) {
        this.logger.info('Repost already verified (idempotent)', {
          submissionId: input.submissionId,
        });
        return {
          success: true,
          verified: true,
        };
      }

      // 3. Validate gate exists and requirements
      const gate = await validateGateExists(
        this.gateRepository,
        submission.gateId.toString()
      );
      validateGateRequiresRepost(gate);
      validateGateHasTrackId(gate);

      // 4. Check repost via SoundCloud API
      this.logger.info('Checking SoundCloud repost', {
        trackId: gate.soundcloudTrackId,
        userId: input.soundcloudUserId,
      });

      const hasReposted = await this.soundCloudClient.checkRepost(
        input.accessToken,
        gate.soundcloudTrackId!,
        input.soundcloudUserId
      );

      if (!hasReposted) {
        this.logger.info('Repost not found', {
          submissionId: input.submissionId,
          trackId: gate.soundcloudTrackId,
        });
        return {
          success: true,
          verified: false,
        };
      }

      // 5. Update submission verification status
      await this.submissionRepository.updateVerificationStatus(input.submissionId, {
        soundcloudRepostVerified: true,
      });

      this.logger.info('Repost verified successfully', {
        submissionId: input.submissionId,
        trackId: gate.soundcloudTrackId,
      });

      // 6. Track analytics event
      await this.trackVerifyRepostEvent(gate.id, input);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      // Handle validation errors explicitly
      if (error instanceof SoundCloudValidationError) {
        this.logger.warn('Validation error during repost verification', {
          error: error.message,
          code: error.code,
          submissionId: input.submissionId,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      this.logger.error(
        'Unexpected error during repost verification',
        error instanceof Error ? error : new Error(String(error)),
        { submissionId: input.submissionId }
      );
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
      this.logger.warn(
        'Failed to track verify_repost event (non-critical)',
        {
          gateId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}
