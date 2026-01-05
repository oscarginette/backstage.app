/**
 * POST /api/upload-signature-logo - Upload logo to Cloudinary for email signature
 *
 * Handles file upload to Cloudinary with email-optimized transformations.
 * Requires authentication.
 *
 * Request: multipart/form-data with 'file' field
 * Response: { url: string, publicId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CloudinaryImageStorage } from '@/infrastructure/storage/CloudinaryImageStorage';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, WebP, and SVG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const storage = new CloudinaryImageStorage();
    const result = await storage.uploadLogo(buffer, userId);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload signature logo error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to upload logo',
      },
      { status: 500 }
    );
  }
}
