/**
 * Download Gate Submission API
 *
 * GET: Fetch submission state from database (via cookie)
 * PATCH: Update submission verification status
 *
 * Database-first state management - eliminates localStorage race conditions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PostgresDownloadSubmissionRepository } from '@/infrastructure/database/repositories/PostgresDownloadSubmissionRepository';
import { sql } from '@/lib/db';

/**
 * GET /api/gate/[slug]/submission
 *
 * Fetches current submission state from database.
 * Reads submissionId from HttpOnly cookie.
 *
 * Returns:
 * - submission object if found and matches slug
 * - null if no submission or cookie not set
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const submissionId = cookieStore.get('backstage_submission_id')?.value;

  if (!submissionId) {
    return NextResponse.json({ submission: null }, { status: 200 });
  }

  try {
    // Query submission with gate slug verification
    // Use JOIN to ensure submission belongs to this gate
    const result = await sql`
      SELECT
        s.id,
        s.email,
        s.soundcloud_repost_verified,
        s.soundcloud_follow_verified,
        s.spotify_connected,
        s.instagram_click_tracked,
        s.download_completed,
        g.slug as gate_slug
      FROM download_submissions s
      JOIN download_gates g ON g.id = s.gate_id
      WHERE s.id = ${submissionId}::uuid
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      // Submission not found - cookie might be invalid
      return NextResponse.json({ submission: null }, { status: 200 });
    }

    const row = result.rows[0];

    // Verify submission belongs to this gate
    if (row.gate_slug !== slug) {
      console.warn('[GET /api/gate/[slug]/submission] Submission gate mismatch:', {
        expectedSlug: slug,
        actualSlug: row.gate_slug,
        submissionId,
      });
      return NextResponse.json({ submission: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        submission: {
          submissionId: row.id,
          email: row.email,
          soundcloudRepostVerified: row.soundcloud_repost_verified,
          soundcloudFollowVerified: row.soundcloud_follow_verified,
          spotifyConnected: row.spotify_connected,
          instagramClickTracked: row.instagram_click_tracked,
          downloadCompleted: row.download_completed,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/gate/[slug]/submission] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/gate/[slug]/submission
 *
 * Updates submission verification status in database.
 * Reads submissionId from HttpOnly cookie.
 *
 * Body:
 * - soundcloudRepostVerified?: boolean
 * - soundcloudFollowVerified?: boolean
 * - spotifyConnected?: boolean
 * - instagramClickTracked?: boolean
 * - downloadCompleted?: boolean
 *
 * Returns updated submission object.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const submissionId = cookieStore.get('backstage_submission_id')?.value;

  if (!submissionId) {
    return NextResponse.json(
      { error: 'No submission found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const repository = new PostgresDownloadSubmissionRepository();

    // Verify submission exists and belongs to this gate
    const existing = await repository.findById(submissionId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Update submission via repository
    // Uses updateVerificationStatus which handles timestamps
    const updated = await repository.updateVerificationStatus(submissionId, {
      soundcloudRepostVerified: body.soundcloudRepostVerified,
      soundcloudFollowVerified: body.soundcloudFollowVerified,
      spotifyConnected: body.spotifyConnected,
      instagramClickTracked: body.instagramClickTracked,
    });

    // Mark download complete if provided
    if (body.downloadCompleted === true) {
      await repository.markDownloadComplete(submissionId);
    }

    // Fetch fresh data after update
    const fresh = await repository.findById(submissionId);

    return NextResponse.json({
      submission: {
        submissionId: fresh!.id,
        email: fresh!.email,
        soundcloudRepostVerified: fresh!.soundcloudRepostVerified,
        soundcloudFollowVerified: fresh!.soundcloudFollowVerified,
        spotifyConnected: fresh!.spotifyConnected,
        instagramClickTracked: fresh!.instagramClickTracked,
        downloadCompleted: fresh!.downloadCompleted,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/gate/[slug]/submission] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
