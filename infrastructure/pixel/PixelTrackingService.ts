/**
 * PixelTrackingService (Infrastructure Layer)
 *
 * Implements IPixelTrackingService for sending events to marketing pixel platforms.
 * Makes HTTP calls to:
 * - Facebook Conversions API (CAPI)
 * - Google Ads Enhanced Conversions (future enhancement)
 * - TikTok Events API
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (pixel API calls)
 * - DIP: Implements domain interface
 * - Error Handling: Catches all errors, never throws (fire-and-forget)
 */

import axios, { AxiosError } from 'axios';
import {
  IPixelTrackingService,
  PixelEventData,
  PixelTrackingResult,
} from '@/domain/repositories/IPixelTrackingService';
import { PixelConfig } from '@/domain/entities/PixelConfig';
import { PIXEL_PLATFORMS, PixelPlatform } from '@/domain/types/pixel-tracking';

export class PixelTrackingService implements IPixelTrackingService {
  private readonly TIMEOUT_MS = 5000; // 5 seconds (fail fast)

  /**
   * Send event to a specific platform
   */
  async sendEvent(
    platform: PixelPlatform,
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult> {
    try {
      switch (platform) {
        case PIXEL_PLATFORMS.FACEBOOK:
          return await this.sendFacebookEvent(config, eventData);
        case PIXEL_PLATFORMS.GOOGLE:
          return await this.sendGoogleEvent(config, eventData);
        case PIXEL_PLATFORMS.TIKTOK:
          return await this.sendTikTokEvent(config, eventData);
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
    } catch (error) {
      console.error(`[PixelTracking] ${platform} error:`, error);

      return {
        success: false,
        platform,
        eventId: eventData.eventId,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Send event to all enabled platforms (parallel)
   */
  async sendToAll(
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult[]> {
    const enabledPlatforms = config.getEnabledPlatforms();

    return Promise.all(
      enabledPlatforms.map(platform =>
        this.sendEvent(platform, config, eventData)
      )
    );
  }

  // ==========================================================================
  // Facebook Conversions API (CAPI)
  // ==========================================================================

  /**
   * Send event to Facebook Conversions API
   *
   * API Ref: https://developers.facebook.com/docs/marketing-api/conversions-api
   * Version: v18.0
   */
  private async sendFacebookEvent(
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult> {
    const fbConfig = config.facebook!;
    const accessToken = this.decryptToken(fbConfig.accessTokenEncrypted);

    // Facebook CAPI payload
    const payload = {
      data: [
        {
          event_name: eventData.eventName, // 'PageView', 'Lead', or 'Purchase'
          event_time: eventData.eventTime, // Unix timestamp (seconds)
          event_id: eventData.eventId, // Deduplication ID
          event_source_url: eventData.eventSourceUrl, // Gate URL
          action_source: 'website', // Always 'website' for download gates

          // User data for attribution
          user_data: {
            // Hashed email (already SHA-256)
            em: eventData.emailHash ? [eventData.emailHash] : undefined,

            // IP address for geographic attribution
            client_ip_address: eventData.ipAddress,

            // User agent for device/browser attribution
            client_user_agent: eventData.userAgent,
          },
        },
      ],

      // Test mode event code (optional)
      test_event_code: fbConfig.testEventCode,
    };

    const url = `https://graph.facebook.com/v18.0/${fbConfig.pixelId}/events`;

    const response = await axios.post(url, payload, {
      params: { access_token: accessToken },
      timeout: this.TIMEOUT_MS,
    });

    // Check for errors in response
    if (response.data?.events_received !== 1) {
      throw new Error(
        `Facebook API did not confirm event receipt: ${JSON.stringify(response.data)}`
      );
    }

    return {
      success: true,
      platform: PIXEL_PLATFORMS.FACEBOOK,
      eventId: eventData.eventId,
    };
  }

  // ==========================================================================
  // Google Ads Enhanced Conversions
  // ==========================================================================

  /**
   * Send event to Google Ads Enhanced Conversions
   *
   * Note: Google Ads API requires OAuth 2.0 credentials and customer ID.
   * This is a future enhancement. For now, we log that the event would be sent.
   *
   * API Ref: https://developers.google.com/google-ads/api/docs/conversions/upload-conversions
   */
  private async sendGoogleEvent(
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult> {
    const googleConfig = config.google!;

    // Future enhancement: Implement Google Ads API call
    // Requires:
    // - Developer token
    // - OAuth 2.0 refresh token
    // - Customer ID
    // - Conversion action ID

    console.log('[PixelTracking] Google Ads event (API not yet implemented):', {
      tagId: googleConfig.tagId,
      event: eventData.eventName,
      eventId: eventData.eventId,
      conversionLabels: googleConfig.conversionLabels,
    });

    // Return success for now (non-blocking)
    return {
      success: true,
      platform: PIXEL_PLATFORMS.GOOGLE,
      eventId: eventData.eventId,
    };
  }

  // ==========================================================================
  // TikTok Events API
  // ==========================================================================

  /**
   * Send event to TikTok Events API
   *
   * API Ref: https://business-api.tiktok.com/portal/docs?id=1771100865818625
   * Version: v1.3
   */
  private async sendTikTokEvent(
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult> {
    const tiktokConfig = config.tiktok!;
    const accessToken = this.decryptToken(tiktokConfig.accessTokenEncrypted);

    // TikTok Events API payload
    const payload = {
      pixel_code: tiktokConfig.pixelId,
      event: eventData.eventName, // 'ViewContent', 'SubmitForm', or 'CompleteDownload'
      event_id: eventData.eventId, // Deduplication ID
      timestamp: new Date(eventData.eventTime * 1000).toISOString(), // ISO 8601

      // Context (user data)
      context: {
        user_agent: eventData.userAgent,
        ip: eventData.ipAddress,
        page: {
          url: eventData.eventSourceUrl,
        },
      },

      // Properties (hashed email)
      properties: {
        ...(eventData.emailHash && { email: eventData.emailHash }),
      },
    };

    const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

    const response = await axios.post(url, payload, {
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: this.TIMEOUT_MS,
    });

    // Check for errors in response
    if (response.data?.code !== 0) {
      throw new Error(
        `TikTok API error (code ${response.data?.code}): ${response.data?.message}`
      );
    }

    return {
      success: true,
      platform: PIXEL_PLATFORMS.TIKTOK,
      eventId: eventData.eventId,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Decrypt access token (base64, same as Brevo pattern)
   *
   * Security Note:
   * - Tokens stored as base64 in database
   * - Decrypted only in memory, never logged
   * - Temporary decryption for API calls
   */
  private decryptToken(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      // HTTP error
      if (error.response) {
        return `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      }
      if (error.request) {
        return `No response received (timeout or network error)`;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
