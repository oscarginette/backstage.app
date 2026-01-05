/**
 * CheckNewReleasesUseCase
 *
 * Checks for new releases from an artist and saves them to fan's library.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Refresh tokens if expired
 * - Get artist's albums from Spotify
 * - Filter out already-saved releases
 * - Save new albums to user library (max 20 per batch)
 * - Record saved releases in database
 * - Update subscription check timestamp
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (checking new releases)
 * - DIP: Depends on repository interfaces and SpotifyClient
 */

import { IAutoSaveSubscriptionRepository } from '../repositories/IAutoSaveSubscriptionRepository';
import { ISavedReleasesRepository } from '../repositories/ISavedReleasesRepository';
import { SpotifyClient } from '@/lib/spotify-client';
import { TokenEncryption } from '@/infrastructure/encryption/TokenEncryption';

export interface CheckNewReleasesInput {
  subscriptionId: string; // UUID
}

export interface CheckNewReleasesResult {
  success: boolean;
  newReleases: number;
  error?: string;
}

export class CheckNewReleasesUseCase {
  constructor(
    private readonly subscriptionRepository: IAutoSaveSubscriptionRepository,
    private readonly savedReleasesRepository: ISavedReleasesRepository,
    private readonly spotifyClient: SpotifyClient,
    private readonly tokenEncryption: TokenEncryption
  ) {}

  /**
   * Execute release check
   * @param input - Check input data
   * @returns CheckNewReleasesResult with count of new releases
   */
  async execute(input: CheckNewReleasesInput): Promise<CheckNewReleasesResult> {
    try {
      // 1. Get subscription
      const subscription = await this.subscriptionRepository.findById(input.subscriptionId);

      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          newReleases: 0,
        };
      }

      if (!subscription.active) {
        return {
          success: false,
          error: 'Subscription is inactive',
          newReleases: 0,
        };
      }

      // 2. Decrypt and refresh token if needed
      let accessToken = this.tokenEncryption.decrypt(subscription.accessTokenEncrypted);

      if (subscription.isTokenExpired()) {
        console.log('[CheckNewReleases] Token expired, refreshing...', {
          subscriptionId: subscription.id,
        });

        const refreshToken = this.tokenEncryption.decrypt(
          subscription.refreshTokenEncrypted
        );

        const tokenData = await this.spotifyClient.refreshAccessToken(refreshToken);

        accessToken = tokenData.access_token;

        // Update stored tokens
        await this.subscriptionRepository.updateTokens(subscription.id, {
          accessTokenEncrypted: this.tokenEncryption.encrypt(tokenData.access_token),
          refreshTokenEncrypted: tokenData.refresh_token
            ? this.tokenEncryption.encrypt(tokenData.refresh_token)
            : subscription.refreshTokenEncrypted,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        });
      }

      // 3. Get artist's albums
      const albums = await this.spotifyClient.getArtistAlbums(
        accessToken,
        subscription.artistSpotifyId,
        'album,single'
      );

      if (albums.length === 0) {
        console.log('[CheckNewReleases] No albums found for artist', {
          artistSpotifyId: subscription.artistSpotifyId,
        });

        await this.subscriptionRepository.updateLastCheck(subscription.id, new Date());
        return { success: true, newReleases: 0 };
      }

      // 4. Filter new releases (not already saved)
      const savedAlbumIds = await this.savedReleasesRepository.getSavedAlbumIds(
        subscription.id
      );
      const newAlbums = albums.filter((album: any) => !savedAlbumIds.includes(album.id));

      if (newAlbums.length === 0) {
        console.log('[CheckNewReleases] No new releases', {
          subscriptionId: subscription.id,
          totalAlbums: albums.length,
        });

        await this.subscriptionRepository.updateLastCheck(subscription.id, new Date());
        return { success: true, newReleases: 0 };
      }

      console.log('[CheckNewReleases] Found new releases:', {
        subscriptionId: subscription.id,
        count: newAlbums.length,
        albums: newAlbums.map((a: any) => ({ id: a.id, name: a.name })),
      });

      // 5. Save new albums to user's library
      const albumIds = newAlbums.map((album: any) => album.id);

      // Spotify allows max 20 albums per request
      const chunks = this.chunkArray(albumIds, 20);

      for (const chunk of chunks) {
        try {
          await this.spotifyClient.saveAlbumsToLibrary(accessToken, chunk);
        } catch (error) {
          console.error('[CheckNewReleases] Failed to save album chunk:', error);
          // Continue with other chunks even if one fails
        }
      }

      // 6. Record saved releases in database
      for (const album of newAlbums) {
        try {
          await this.savedReleasesRepository.create({
            subscriptionId: subscription.id,
            releaseType: album.album_type || 'album',
            spotifyAlbumId: album.id,
            spotifyTrackIds: [],
            albumName: album.name,
            releaseDate: new Date(album.release_date || Date.now()),
            saveStatus: 'success',
          });
        } catch (error) {
          console.error('[CheckNewReleases] Failed to record saved release:', error);
          // Non-critical: continue even if database record fails
        }
      }

      // 7. Update subscription check timestamp
      await this.subscriptionRepository.updateLastCheck(subscription.id, new Date());

      return {
        success: true,
        newReleases: newAlbums.length,
      };
    } catch (error) {
      console.error('CheckNewReleasesUseCase.execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check releases',
        newReleases: 0,
      };
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
