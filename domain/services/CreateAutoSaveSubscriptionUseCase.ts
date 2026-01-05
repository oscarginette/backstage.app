/**
 * CreateAutoSaveSubscriptionUseCase
 *
 * Handles creation of auto-save subscriptions when fans opt in.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validate required data
 * - Encrypt OAuth tokens before storage
 * - Prevent duplicate subscriptions (idempotent)
 * - Schedule first check immediately
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (subscription creation)
 * - DIP: Depends on repository interface and encryption service
 */

import { IAutoSaveSubscriptionRepository } from '../repositories/IAutoSaveSubscriptionRepository';
import { TokenEncryption } from '@/infrastructure/encryption/TokenEncryption';

export interface CreateAutoSaveSubscriptionInput {
  submissionId: string; // UUID
  spotifyUserId: string; // Fan's Spotify ID
  artistUserId: number; // Artist user ID
  artistSpotifyId: string; // Artist's Spotify ID
  accessToken: string; // Plain text access token
  refreshToken: string; // Plain text refresh token
  expiresIn: number; // Seconds until token expires
}

export interface CreateAutoSaveSubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
  alreadyExists?: boolean;
}

export class CreateAutoSaveSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: IAutoSaveSubscriptionRepository,
    private readonly tokenEncryption: TokenEncryption
  ) {}

  /**
   * Execute subscription creation
   * @param input - Subscription data
   * @returns CreateAutoSaveSubscriptionResult with success status
   */
  async execute(
    input: CreateAutoSaveSubscriptionInput
  ): Promise<CreateAutoSaveSubscriptionResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Check if subscription already exists (idempotent)
      const existing = await this.subscriptionRepository.findByUserAndArtist(
        input.spotifyUserId,
        input.artistSpotifyId
      );

      if (existing) {
        return {
          success: true,
          subscriptionId: existing.id,
          alreadyExists: true,
        };
      }

      // 3. Encrypt tokens
      const accessTokenEncrypted = this.tokenEncryption.encrypt(input.accessToken);
      const refreshTokenEncrypted = this.tokenEncryption.encrypt(input.refreshToken);

      // 4. Calculate token expiry
      const tokenExpiresAt = new Date(Date.now() + input.expiresIn * 1000);

      // 5. Schedule first check immediately
      const nextCheckAt = new Date();

      // 6. Create subscription
      const subscriptionId = await this.subscriptionRepository.create({
        submissionId: input.submissionId,
        spotifyUserId: input.spotifyUserId,
        artistUserId: input.artistUserId,
        artistSpotifyId: input.artistSpotifyId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        nextCheckAt,
      });

      console.log('[CreateAutoSaveSubscription] Subscription created:', {
        subscriptionId,
        spotifyUserId: input.spotifyUserId,
        artistSpotifyId: input.artistSpotifyId,
      });

      return {
        success: true,
        subscriptionId,
        alreadyExists: false,
      };
    } catch (error) {
      console.error('CreateAutoSaveSubscriptionUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }

  /**
   * Validate input data
   */
  private validateInput(input: CreateAutoSaveSubscriptionInput): void {
    if (!input.submissionId) {
      throw new Error('Submission ID is required');
    }
    if (!input.spotifyUserId) {
      throw new Error('Spotify user ID is required');
    }
    if (!input.artistSpotifyId) {
      throw new Error('Artist Spotify ID is required');
    }
    if (!input.accessToken) {
      throw new Error('Access token is required');
    }
    if (!input.refreshToken) {
      throw new Error('Refresh token is required');
    }
    if (!input.expiresIn || input.expiresIn <= 0) {
      throw new Error('Valid expires_in is required');
    }
  }
}
