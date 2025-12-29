/**
 * Sentry Test Endpoint
 *
 * This endpoint is used to test Sentry integration.
 * Deliberately throws different types of errors to verify Sentry is capturing them.
 *
 * Usage:
 * - GET /api/debug/sentry-test?type=server - Test server error
 * - GET /api/debug/sentry-test?type=validation - Test validation error
 * - GET /api/debug/sentry-test?type=async - Test async error
 * - GET /api/debug/sentry-test - Test generic error
 *
 * WARNING: This endpoint should be disabled in production or protected by auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ValidationError, InternalServerError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  // In production, require authentication or disable entirely
  if (process.env.NODE_ENV === 'production') {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type') || 'generic';

  // Add context to Sentry
  Sentry.setContext('test_endpoint', {
    errorType,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });

  Sentry.setTag('test_error', errorType);

  try {
    switch (errorType) {
      case 'server':
        throw new InternalServerError('Test server error from Sentry test endpoint');

      case 'validation':
        throw new ValidationError('Test validation error: Invalid email format', {
          field: 'email',
          value: 'invalid-email',
        });

      case 'async':
        await testAsyncError();
        break;

      case 'quota':
        const { QuotaExceededError } = await import('@/lib/errors');
        throw new QuotaExceededError('Test quota exceeded error', {
          limit: 100,
          current: 101,
        });

      case 'message':
        // Test Sentry.captureMessage
        Sentry.captureMessage('Test message from Sentry test endpoint', {
          level: 'info',
          tags: {
            test: 'message',
          },
        });
        return NextResponse.json({
          success: true,
          message: 'Message sent to Sentry',
        });

      default:
        throw new Error('Generic test error from Sentry test endpoint');
    }

    return NextResponse.json({
      success: true,
      message: 'Error should have been thrown',
    });
  } catch (error) {
    // Capture to Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        endpoint: 'sentry-test',
        errorType,
      },
      extra: {
        requestUrl: request.url,
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Also throw to trigger global error handler
    throw error;
  }
}

/**
 * Test async error handling
 */
async function testAsyncError(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error('Test async error from Sentry');
}
