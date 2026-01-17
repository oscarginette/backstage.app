/**
 * SaveSpotifyTrackUseCase
 *
 * Handles saving a Spotify track to user's library (Liked Songs).
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Extract track ID from Spotify URL
 * - Check if track is already saved (idempotent)
 * - Save track to user's library
 * - Update submission record with save status
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (track saving)
 * - DIP: Depends on repository interface and SpotifyClient
 *
 * Security:
 * - Uses access token from OAuth (already validated)
 * - Non-blocking: submission succeeds even if save fails
 */

import { SpotifyClient } from '@/lib/spotify-client';
import { IDownloadSubmissionRepository } from '../repositories/IDownloadSubmissionRepository';

export interface SaveSpotifyTrackInput {
  submissionId: string; // UUID
  accessToken: string; // Spotify OAuth access token
  spotifyTrackUrl: string; // Full Spotify track URL (e.g., https://open.spotify.com/track/...)
}

export interface SaveSpotifyTrackResult {
  success: boolean;
  error?: string;
  alreadySaved?: boolean;
  trackId?: string;
}

export class SaveSpotifyTrackUseCase {
  constructor(
    private readonly spotifyClient: SpotifyClient,
    private readonly submissionRepository: IDownloadSubmissionRepository
  ) {}

  /**
   * Execute track save operation
   * @param input - Save track data
   * @returns SaveSpotifyTrackResult with success status
   */
  async execute(input: SaveSpotifyTrackInput): Promise<SaveSpotifyTrackResult> {
    try {
      // 1. Extract track ID from Spotify URL
      const trackId = this.extractTrackIdFromUrl(input.spotifyTrackUrl);

      if (!trackId) {
        return {
          success: false,
          error: 'Invalid Spotify track URL',
        };
      }

      console.log('[SaveSpotifyTrack] Extracted track ID:', trackId);

      // 2. Check if track is already saved (idempotent operation)
      const [isSaved] = await this.spotifyClient.checkSavedTracks(input.accessToken, [
        trackId,
      ]);

      if (isSaved) {
        console.log('[SaveSpotifyTrack] Track already saved to library:', trackId);

        // Still update our record
        await this.submissionRepository.updateSpotifyTrackSaved(input.submissionId, true);

        return {
          success: true,
          alreadySaved: true,
          trackId,
        };
      }

      // 3. Save track to library
      await this.spotifyClient.saveTracksToLibrary(input.accessToken, [trackId]);

      console.log('[SaveSpotifyTrack] Track saved to library:', trackId);

      // 4. Update submission record
      await this.submissionRepository.updateSpotifyTrackSaved(input.submissionId, true);

      return {
        success: true,
        alreadySaved: false,
        trackId,
      };
    } catch (error) {
      console.error('[SaveSpotifyTrack] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save track',
      };
    }
  }

  /**
   * Extract Spotify track ID from URL
   *
   * Supported formats:
   * - https://open.spotify.com/track/{TRACK_ID}
   * - https://open.spotify.com/track/{TRACK_ID}?si=...
   * - spotify:track:{TRACK_ID}
   *
   * @param url - Spotify track URL or URI
   * @returns Track ID or null if invalid
   */
  private extractTrackIdFromUrl(url: string): string | null {
    if (!url) {
      return null;
    }

    // Remove whitespace
    url = url.trim();

    // Format 1: https://open.spotify.com/track/{TRACK_ID}
    const urlMatch = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Format 2: spotify:track:{TRACK_ID}
    const uriMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
    if (uriMatch) {
      return uriMatch[1];
    }

    // Format 3: Just the ID itself (22 alphanumeric characters)
    if (/^[a-zA-Z0-9]{22}$/.test(url)) {
      return url;
    }

    return null;
  }
}
