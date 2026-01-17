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
import { ISoundCloudClient } from '@/domain/providers/ISoundCloudClient';
import { ILogger } from '@/infrastructure/logging/Logger';
import {
  validateSubmissionExists,
  validateGateExists,
  validateGateRequiresFollow,
  validateGateHasUserId,
  SoundCloudValidationError,
} from '@/domain/utils/soundcloud-validation';

export interface VerifySoundCloudFollowInput {
  submissionId: string;
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
    private readonly soundCloudClient: ISoundCloudClient,
    private readonly logger: ILogger
  ) {}

  /**
   * Execute follow verification
   * @param input - Verification data (submission ID, access token, user ID)
   * @returns Verification result
   */
  async execute(input: VerifySoundCloudFollowInput): Promise<VerifySoundCloudFollowResult> {
    try {
      // 1. Validate submission exists
      const submission = await validateSubmissionExists(
        this.submissionRepository,
        input.submissionId
      );

      // 2. Check if already verified (idempotent)
      if (submission.soundcloudFollowVerified) {
        this.logger.info('Submission already verified (idempotent)', {
          submissionId: input.submissionId,
        });
        return {
          success: true,
          verified: true,
        };
      }

      // 3. Validate gate exists and requires follow
      const gate = await validateGateExists(
        this.gateRepository,
        submission.gateId.toString()
      );
      validateGateRequiresFollow(gate);
      validateGateHasUserId(gate);

      // 4. Check follow via SoundCloud API
      this.logger.info('Checking SoundCloud follow status', {
        submissionId: input.submissionId,
        targetUserId: gate.soundcloudUserId,
        userId: input.soundcloudUserId,
      });

      const isFollowing = await this.soundCloudClient.checkFollow(
        input.accessToken,
        gate.soundcloudUserId!,
        input.soundcloudUserId
      );

      if (!isFollowing) {
        this.logger.info('SoundCloud follow not verified', {
          submissionId: input.submissionId,
          targetUserId: gate.soundcloudUserId,
        });
        return {
          success: true,
          verified: false,
        };
      }

      // 5. Update submission verification status
      await this.submissionRepository.updateVerificationStatus(input.submissionId, {
        soundcloudFollowVerified: true,
      });

      this.logger.info('SoundCloud follow verified successfully', {
        submissionId: input.submissionId,
        targetUserId: gate.soundcloudUserId,
      });

      // 6. Track analytics event
      await this.trackVerifyFollowEvent(gate.id, input);

      return {
        success: true,
        verified: true,
      };
    } catch (error) {
      // Handle validation errors with specific error messages
      if (error instanceof SoundCloudValidationError) {
        this.logger.warn('Validation failed', {
          submissionId: input.submissionId,
          error: error.message,
          code: error.code,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle unexpected errors
      this.logger.error(
        'Failed to verify SoundCloud follow',
        error instanceof Error ? error : new Error(String(error)),
        { submissionId: input.submissionId }
      );
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
      this.logger.warn('Failed to track verify_follow event (non-critical)', {
        gateId,
        submissionId: input.submissionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
