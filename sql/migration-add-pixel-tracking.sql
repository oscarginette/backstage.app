-- Migration: Add pixel tracking configuration to download_gates
-- Date: 2026-01-05
-- Purpose: Add per-gate pixel configuration for Facebook, Google Ads, and TikTok tracking

-- Add pixel_config JSONB column
ALTER TABLE download_gates
ADD COLUMN pixel_config JSONB DEFAULT NULL;

-- GIN index for efficient querying of gates with pixels enabled
CREATE INDEX idx_download_gates_pixel_config
ON download_gates USING GIN (pixel_config)
WHERE pixel_config IS NOT NULL;

-- Add column comment for documentation
COMMENT ON COLUMN download_gates.pixel_config IS
'Per-gate pixel configuration for marketing conversion tracking.
Stores encrypted access tokens and platform-specific settings for:
- Facebook Pixel (Conversions API)
- Google Ads (Enhanced Conversions)
- TikTok Pixel (Events API)

Schema: {
  facebook?: { enabled: boolean, pixelId: string, accessTokenEncrypted: string, testEventCode?: string },
  google?: { enabled: boolean, tagId: string, conversionLabels: { view?: string, submit?: string, download?: string } },
  tiktok?: { enabled: boolean, pixelId: string, accessTokenEncrypted: string }
}';
