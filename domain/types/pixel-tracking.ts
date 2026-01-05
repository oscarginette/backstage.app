/**
 * Pixel Tracking Types
 *
 * Typed constants for marketing pixel tracking (Facebook, Google Ads, TikTok).
 * Following codebase standard: NEVER use string literals for domain values.
 *
 * Usage:
 * import { PIXEL_PLATFORMS, PIXEL_EVENTS } from '@/domain/types/pixel-tracking';
 *
 * if (platform === PIXEL_PLATFORMS.FACEBOOK) { ... }
 * trackEvent(PIXEL_EVENTS.PAGE_VIEW);
 */

// ============================================================================
// Platforms
// ============================================================================

export const PIXEL_PLATFORMS = {
  FACEBOOK: 'facebook' as const,
  GOOGLE: 'google' as const,
  TIKTOK: 'tiktok' as const,
} as const;

export type PixelPlatform = typeof PIXEL_PLATFORMS[keyof typeof PIXEL_PLATFORMS];

// ============================================================================
// Internal Events (Normalized)
// ============================================================================

/**
 * Internal event types (normalized across platforms).
 * These map to platform-specific event names via EVENT_MAPPING.
 */
export const PIXEL_EVENTS = {
  PAGE_VIEW: 'page_view' as const,
  LEAD: 'lead' as const,
  CONVERSION: 'conversion' as const,
} as const;

export type PixelEvent = typeof PIXEL_EVENTS[keyof typeof PIXEL_EVENTS];

// ============================================================================
// Platform-Specific Event Names
// ============================================================================

/**
 * Facebook Pixel standard event names
 * Ref: https://developers.facebook.com/docs/meta-pixel/reference
 */
export const FACEBOOK_EVENTS = {
  PAGE_VIEW: 'PageView' as const,
  LEAD: 'Lead' as const,
  PURCHASE: 'Purchase' as const, // Download = free "purchase"
} as const;

/**
 * Google Ads event names
 * Ref: https://support.google.com/google-ads/answer/7548399
 */
export const GOOGLE_EVENTS = {
  PAGE_VIEW: 'page_view' as const,
  CONVERSION: 'conversion' as const,
} as const;

/**
 * TikTok Pixel standard event names
 * Ref: https://ads.tiktok.com/help/article/standard-events-parameters
 */
export const TIKTOK_EVENTS = {
  VIEW_CONTENT: 'ViewContent' as const,
  SUBMIT_FORM: 'SubmitForm' as const,
  COMPLETE_DOWNLOAD: 'CompleteDownload' as const,
} as const;

// ============================================================================
// Event Mapping (Internal -> Platform-Specific)
// ============================================================================

/**
 * Maps internal normalized events to platform-specific event names.
 *
 * Example:
 * const fbEventName = EVENT_MAPPING[PIXEL_EVENTS.PAGE_VIEW][PIXEL_PLATFORMS.FACEBOOK];
 * // Returns: 'PageView'
 */
export const EVENT_MAPPING = {
  [PIXEL_EVENTS.PAGE_VIEW]: {
    [PIXEL_PLATFORMS.FACEBOOK]: FACEBOOK_EVENTS.PAGE_VIEW,
    [PIXEL_PLATFORMS.GOOGLE]: GOOGLE_EVENTS.PAGE_VIEW,
    [PIXEL_PLATFORMS.TIKTOK]: TIKTOK_EVENTS.VIEW_CONTENT,
  },
  [PIXEL_EVENTS.LEAD]: {
    [PIXEL_PLATFORMS.FACEBOOK]: FACEBOOK_EVENTS.LEAD,
    [PIXEL_PLATFORMS.GOOGLE]: GOOGLE_EVENTS.CONVERSION,
    [PIXEL_PLATFORMS.TIKTOK]: TIKTOK_EVENTS.SUBMIT_FORM,
  },
  [PIXEL_EVENTS.CONVERSION]: {
    [PIXEL_PLATFORMS.FACEBOOK]: FACEBOOK_EVENTS.PURCHASE,
    [PIXEL_PLATFORMS.GOOGLE]: GOOGLE_EVENTS.CONVERSION,
    [PIXEL_PLATFORMS.TIKTOK]: TIKTOK_EVENTS.COMPLETE_DOWNLOAD,
  },
} as const;
