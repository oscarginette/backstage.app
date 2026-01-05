/**
 * IPixelTrackingService (Repository Interface)
 *
 * Dependency Inversion Principle (DIP):
 * - Domain layer defines the interface
 * - Infrastructure layer implements it
 * - Use cases depend on this abstraction, not concrete implementations
 *
 * This enables:
 * - Easy testing with mock implementations
 * - Swapping pixel services without changing domain logic
 * - Isolation of business logic from external APIs
 */

import { PixelPlatform } from '../types/pixel-tracking';
import { PixelConfig } from '../entities/PixelConfig';

// ============================================================================
// Pixel Event Data
// ============================================================================

/**
 * Data sent to pixel tracking platforms.
 * Includes deduplication ID, user data, and event context.
 */
export interface PixelEventData {
  /**
   * Deduplication ID (from analytics UUID)
   * Used to prevent same event being counted twice across pixel + server API
   */
  eventId: string;

  /**
   * Platform-specific event name
   * Examples: 'PageView' (Facebook), 'page_view' (Google), 'ViewContent' (TikTok)
   */
  eventName: string;

  /**
   * Unix timestamp (seconds since epoch)
   * When the event occurred
   */
  eventTime: number;

  /**
   * Event source URL
   * Example: https://thebackstage.app/gate/my-track
   */
  eventSourceUrl: string;

  /**
   * User agent string
   * Optional: Browser/device info for attribution
   */
  userAgent?: string;

  /**
   * IP address
   * Optional: Used for geographic attribution
   */
  ipAddress?: string;

  /**
   * SHA-256 hashed email (GDPR-compliant)
   * Optional: Only for Lead/Conversion events
   * Already hashed before reaching this interface
   */
  emailHash?: string;

  /**
   * Custom data for platform-specific fields
   * Optional: Additional event parameters
   */
  customData?: Record<string, any>;
}

// ============================================================================
// Pixel Tracking Result
// ============================================================================

/**
 * Result of sending an event to a pixel platform
 */
export interface PixelTrackingResult {
  /**
   * Whether the event was sent successfully
   */
  success: boolean;

  /**
   * Platform that received (or failed to receive) the event
   */
  platform: PixelPlatform;

  /**
   * Event ID that was sent (for logging/debugging)
   */
  eventId: string;

  /**
   * Error message if success = false
   */
  error?: string;
}

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Pixel Tracking Service Interface
 *
 * Sends conversion events to marketing pixel platforms via server-side APIs.
 * Implementations handle platform-specific API calls (Facebook CAPI, Google Enhanced Conversions, TikTok Events API).
 */
export interface IPixelTrackingService {
  /**
   * Send event to a specific platform
   *
   * @param platform - Platform to send to (Facebook, Google, TikTok)
   * @param config - Pixel configuration (contains credentials)
   * @param eventData - Event data to send
   * @returns Promise<PixelTrackingResult> - Success/failure result
   *
   * Error Handling:
   * - Catches all errors internally
   * - Returns { success: false, error: message }
   * - NEVER throws (fire-and-forget pattern)
   */
  sendEvent(
    platform: PixelPlatform,
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult>;

  /**
   * Send event to all enabled platforms (parallel)
   *
   * @param config - Pixel configuration (contains all platform configs)
   * @param eventData - Event data to send
   * @returns Promise<PixelTrackingResult[]> - Results for each platform
   *
   * Note:
   * - Only sends to enabled platforms (config.getEnabledPlatforms())
   * - Executes in parallel (Promise.all)
   * - Individual failures don't block other platforms
   */
  sendToAll(
    config: PixelConfig,
    eventData: PixelEventData
  ): Promise<PixelTrackingResult[]>;
}
