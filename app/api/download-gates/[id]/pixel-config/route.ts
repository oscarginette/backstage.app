/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel tracking configuration for a download gate
 *
 * Clean Architecture: API route only orchestrates, validation in domain.
 * Security: Requires authentication, verifies gate ownership.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PixelConfig } from '@/domain/entities/PixelConfig';
import { PostgresDownloadGateRepository } from '@/infrastructure/database/repositories/PostgresDownloadGateRepository';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UpdatePixelConfigBody {
  pixelConfig: {
    facebook?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
      testEventCode?: string;
    };
    google?: {
      enabled: boolean;
      tagId: string;
      conversionLabels?: {
        view?: string;
        submit?: string;
        download?: string;
      };
    };
    tiktok?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
  };
}

/**
 * PATCH /api/download-gates/[id]/pixel-config
 * Update pixel configuration for a gate
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: gateId } = await params;
    const userId = parseInt(session.user.id);

    // 2. Verify gate exists and user owns it
    const gateRepository = new PostgresDownloadGateRepository();
    const gate = await gateRepository.findById(userId, gateId);

    if (!gate) {
      return NextResponse.json(
        { error: 'Download gate not found or access denied' },
        { status: 404 }
      );
    }

    // 3. Parse and validate request body
    const body: UpdatePixelConfigBody = await request.json();

    // 4. Encrypt access tokens (base64, same as Brevo pattern)
    const configWithEncryptedTokens = encryptTokens(body.pixelConfig);

    // 5. Validate pixel config (throws if invalid)
    let pixelConfig: PixelConfig | null = null;

    if (Object.keys(configWithEncryptedTokens).length > 0) {
      pixelConfig = PixelConfig.create(configWithEncryptedTokens);
    }

    // 6. Update pixel_config in database
    await sql`
      UPDATE download_gates
      SET
        pixel_config = ${pixelConfig ? JSON.stringify(pixelConfig.toJSON()) : null},
        updated_at = NOW()
      WHERE id = ${gateId} AND user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Pixel configuration updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/download-gates/[id]/pixel-config error:', error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update pixel configuration' },
      { status: 500 }
    );
  }
}

/**
 * Encrypt access tokens before storing in database
 * Base64 encoding (same as Brevo integration pattern)
 *
 * @param config - Pixel config with plain text tokens
 * @returns Config with encrypted tokens
 */
function encryptTokens(config: any): any {
  const encrypted = { ...config };

  // Encrypt Facebook access token
  if (config.facebook?.accessToken) {
    encrypted.facebook = {
      ...config.facebook,
      accessTokenEncrypted: Buffer.from(config.facebook.accessToken).toString('base64'),
    };
    delete encrypted.facebook.accessToken;
  }

  // Encrypt TikTok access token
  if (config.tiktok?.accessToken) {
    encrypted.tiktok = {
      ...config.tiktok,
      accessTokenEncrypted: Buffer.from(config.tiktok.accessToken).toString('base64'),
    };
    delete encrypted.tiktok.accessToken;
  }

  return encrypted;
}
