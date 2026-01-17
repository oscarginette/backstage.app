/**
 * GET /api/auth/soundcloud/callback
 * SoundCloud OAuth 2.1 callback handler with PKCE verification (public endpoint)
 *
 * Clean Architecture: API route only orchestrates, business logic delegated to SoundCloudOAuthCallbackUseCase.
 *
 * Flow:
 * 1. Validate OAuth error parameter
 * 2. Validate required parameters (code, state)
 * 3. Extract request metadata (IP, user agent)
 * 4. Delegate to SoundCloudOAuthCallbackUseCase for:
 *    - State token validation (CSRF protection)
 *    - PKCE verification (OAuth 2.1 requirement)
 *    - Token exchange
 *    - SoundCloud profile retrieval
 *    - Submission update
 *    - Social actions (repost, favorite, follow)
 *    - Comment posting
 *    - Buy link update
 * 5. Redirect to gate page with success/error
 *
 * NOTE: Business logic delegated to SoundCloudOAuthCallbackUseCase.
 * All social actions are best-effort and non-blocking (failures don't prevent download).
 *
 * Query Parameters:
 * - code: Authorization code from SoundCloud
 * - state: State token for CSRF protection
 * - error: OAuth error (if authorization failed)
 *
 * Security:
 * - PKCE prevents authorization code interception (OAuth 2.1)
 * - State token validation (exists, not used, not expired)
 * - One-time use tokens
 * - Access token never exposed to browser
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { env, getAppUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/soundcloud/callback
 * Handle SoundCloud OAuth callback
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check if user denied authorization
    if (error) {
      console.error('SoundCloud OAuth error:', error, errorDescription);
      return redirectToGateWithError(
        'SoundCloud authorization was denied',
        null
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return redirectToGateWithError(
        'Missing authorization code or state',
        null
      );
    }

    // Extract request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Instantiate use case
    const useCase = UseCaseFactory.createSoundCloudOAuthCallbackUseCase();

    // Execute business logic
    const redirectUri =
      env.SOUNDCLOUD_REDIRECT_URI ||
      `${getAppUrl()}/api/auth/soundcloud/callback`;

    const result = await useCase.execute({
      code,
      state,
      redirectUri,
      ipAddress,
      userAgent,
    });

    // Handle result
    if (!result.success) {
      return redirectToGateWithError(
        result.error || 'Failed to complete SoundCloud authentication',
        result.gateSlug || null
      );
    }

    // Construct success redirect
    const gateUrl = new URL(`${getAppUrl()}/gate/${result.gateSlug}`);
    gateUrl.searchParams.set('oauth', 'success');
    gateUrl.searchParams.set('provider', 'soundcloud');
    if (result.buyLinkUpdated) {
      gateUrl.searchParams.set('buyLink', 'success');
    }

    return NextResponse.redirect(gateUrl.toString());
  } catch (error) {
    console.error('GET /api/auth/soundcloud/callback error:', error);

    return redirectToGateWithError(
      'An unexpected error occurred',
      null
    );
  }
}

/**
 * Redirect to gate page with error message
 * @param errorMessage - Error message to display
 * @param gateSlug - Gate slug (if known)
 * @returns NextResponse redirect
 */
function redirectToGateWithError(
  errorMessage: string,
  gateSlug: string | null
): NextResponse {
  const baseUrl = getAppUrl();

  if (gateSlug) {
    const url = `${baseUrl}/gate/${gateSlug}?soundcloud=error&error=${encodeURIComponent(errorMessage)}`;
    return NextResponse.redirect(url);
  }

  // If we don't know the gate, redirect to home with error
  const url = `${baseUrl}?error=${encodeURIComponent(errorMessage)}`;
  return NextResponse.redirect(url);
}
