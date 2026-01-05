/**
 * PixelConfig Entity (Value Object)
 *
 * Immutable domain entity representing marketing pixel configuration.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Facebook Pixel ID must be exactly 15 digits
 * - Google Ads Tag ID must start with "AW-"
 * - TikTok Pixel ID must be alphanumeric (7+ chars)
 * - Access tokens required when platform enabled
 * - Validation occurs on construction (fail fast)
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (pixel configuration)
 * - Immutability: Value object pattern
 */

import { PIXEL_PLATFORMS, PixelPlatform } from '../types/pixel-tracking';

// ============================================================================
// Platform-Specific Configuration Interfaces
// ============================================================================

export interface FacebookPixelConfig {
  enabled: boolean;
  pixelId: string;
  accessTokenEncrypted: string;
  testEventCode?: string; // Optional test mode event code
}

export interface GooglePixelConfig {
  enabled: boolean;
  tagId: string; // Format: AW-XXXXXXXXX
  conversionLabels: {
    view?: string;
    submit?: string;
    download?: string;
  };
}

export interface TikTokPixelConfig {
  enabled: boolean;
  pixelId: string;
  accessTokenEncrypted: string;
}

// ============================================================================
// Pixel Config Data (JSONB Storage)
// ============================================================================

export interface PixelConfigData {
  facebook?: FacebookPixelConfig;
  google?: GooglePixelConfig;
  tiktok?: TikTokPixelConfig;
}

// ============================================================================
// PixelConfig Entity
// ============================================================================

export class PixelConfig {
  private constructor(private readonly data: PixelConfigData) {
    this.validate();
  }

  /**
   * Validate pixel configuration
   * Throws error if invalid (fail fast)
   */
  private validate(): void {
    // Facebook validation
    if (this.data.facebook?.enabled) {
      const fb = this.data.facebook;

      // Pixel ID: exactly 15 digits
      if (!/^\d{15}$/.test(fb.pixelId)) {
        throw new Error(
          'Invalid Facebook Pixel ID: must be exactly 15 digits'
        );
      }

      // Access token required when enabled
      if (!fb.accessTokenEncrypted || fb.accessTokenEncrypted.trim().length === 0) {
        throw new Error(
          'Facebook Access Token is required when Facebook Pixel is enabled'
        );
      }
    }

    // Google Ads validation
    if (this.data.google?.enabled) {
      const google = this.data.google;

      // Tag ID: must start with "AW-"
      if (!/^AW-\d+$/.test(google.tagId)) {
        throw new Error(
          'Invalid Google Ads Tag ID: must start with "AW-" followed by numbers (e.g., AW-123456789)'
        );
      }
    }

    // TikTok validation
    if (this.data.tiktok?.enabled) {
      const tiktok = this.data.tiktok;

      // Pixel ID: alphanumeric, 7+ chars
      if (!/^[A-Z0-9]{7,}$/i.test(tiktok.pixelId)) {
        throw new Error(
          'Invalid TikTok Pixel ID: must be alphanumeric and at least 7 characters long'
        );
      }

      // Access token required when enabled
      if (!tiktok.accessTokenEncrypted || tiktok.accessTokenEncrypted.trim().length === 0) {
        throw new Error(
          'TikTok Access Token is required when TikTok Pixel is enabled'
        );
      }
    }
  }

  // ==========================================================================
  // Business Logic Methods
  // ==========================================================================

  /**
   * Check if a specific platform is enabled
   */
  isPlatformEnabled(platform: PixelPlatform): boolean {
    switch (platform) {
      case PIXEL_PLATFORMS.FACEBOOK:
        return this.data.facebook?.enabled ?? false;
      case PIXEL_PLATFORMS.GOOGLE:
        return this.data.google?.enabled ?? false;
      case PIXEL_PLATFORMS.TIKTOK:
        return this.data.tiktok?.enabled ?? false;
      default:
        return false;
    }
  }

  /**
   * Get list of all enabled platforms
   */
  getEnabledPlatforms(): PixelPlatform[] {
    const platforms: PixelPlatform[] = [];

    if (this.data.facebook?.enabled) {
      platforms.push(PIXEL_PLATFORMS.FACEBOOK);
    }
    if (this.data.google?.enabled) {
      platforms.push(PIXEL_PLATFORMS.GOOGLE);
    }
    if (this.data.tiktok?.enabled) {
      platforms.push(PIXEL_PLATFORMS.TIKTOK);
    }

    return platforms;
  }

  /**
   * Check if any platform is enabled
   */
  hasAnyPlatformEnabled(): boolean {
    return this.getEnabledPlatforms().length > 0;
  }

  // ==========================================================================
  // Getters (Immutable Access)
  // ==========================================================================

  get facebook(): FacebookPixelConfig | undefined {
    return this.data.facebook;
  }

  get google(): GooglePixelConfig | undefined {
    return this.data.google;
  }

  get tiktok(): TikTokPixelConfig | undefined {
    return this.data.tiktok;
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Convert to JSON for database storage
   */
  toJSON(): PixelConfigData {
    return { ...this.data };
  }

  // ==========================================================================
  // Factory Methods
  // ==========================================================================

  /**
   * Create from database JSONB column
   * Returns null if no config exists
   */
  static fromDatabase(jsonb: any): PixelConfig | null {
    if (!jsonb) {
      return null;
    }

    return new PixelConfig(jsonb as PixelConfigData);
  }

  /**
   * Create new pixel configuration
   * Throws error if validation fails
   */
  static create(data: PixelConfigData): PixelConfig {
    return new PixelConfig(data);
  }

  /**
   * Create empty configuration (no pixels enabled)
   */
  static createEmpty(): PixelConfig {
    return new PixelConfig({});
  }
}
