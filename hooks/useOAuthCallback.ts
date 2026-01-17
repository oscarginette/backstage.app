/**
 * useOAuthCallback Hook
 *
 * Handles OAuth redirect callback from SoundCloud/Spotify.
 * Parses URL parameters and triggers success/error handlers.
 *
 * Single Responsibility: OAuth callback handling
 */

import { useEffect, useState } from 'react';
import { OAUTH_STATUS, GATE_TIMEOUTS, GATE_STORAGE_PREFIX, OAUTH_PROVIDERS } from '@/domain/types/download-gate-steps';

interface UseOAuthCallbackResult {
  oauthError: string | null;
  buyLinkSuccess: boolean;
}

interface UseOAuthCallbackProps {
  slug: string;
  onSuccess: (provider: string) => void;
}

/**
 * Handle OAuth callback from URL parameters
 *
 * @param slug - Gate slug for localStorage key
 * @param onSuccess - Callback when OAuth succeeds (receives provider name)
 * @returns OAuth error message and buy link success flag
 */
export function useOAuthCallback({ slug, onSuccess }: UseOAuthCallbackProps): UseOAuthCallbackResult {
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [buyLinkSuccess, setBuyLinkSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('oauth');
    const provider = params.get('provider');
    const message = params.get('message');
    const buyLink = params.get('buyLink');

    if (status === OAUTH_STATUS.SUCCESS && provider) {
      console.log('[useOAuthCallback] OAuth success detected:', provider);

      // Update localStorage DIRECTLY to ensure submission is updated immediately
      const storageKey = `${GATE_STORAGE_PREFIX}${slug}`;
      const savedSubmission = localStorage.getItem(storageKey);

      if (savedSubmission) {
        try {
          const submission = JSON.parse(savedSubmission);
          console.log('[useOAuthCallback] Current submission:', submission);

          // Update submission based on provider
          if (provider === OAUTH_PROVIDERS.SOUNDCLOUD) {
            submission.soundcloudRepostVerified = true;
            submission.soundcloudFollowVerified = true;
            console.log('[useOAuthCallback] Updated submission with SoundCloud verification');
          } else if (provider === OAUTH_PROVIDERS.SPOTIFY) {
            submission.spotifyConnected = true;
            console.log('[useOAuthCallback] Updated submission with Spotify connection');
          }

          // Save back to localStorage
          localStorage.setItem(storageKey, JSON.stringify(submission));
          console.log('[useOAuthCallback] Submission saved to localStorage');

          // Trigger callback to force re-render
          onSuccess(provider);
        } catch (error) {
          console.error('[useOAuthCallback] Failed to parse/update submission:', error);
        }
      } else {
        console.warn('[useOAuthCallback] No submission found in localStorage');
      }

      // Show buy link success message if applicable
      if (buyLink === OAUTH_STATUS.SUCCESS) {
        setBuyLinkSuccess(true);
        setTimeout(() => setBuyLinkSuccess(false), GATE_TIMEOUTS.BUY_LINK_SUCCESS_MS);
      }

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === OAUTH_STATUS.ERROR) {
      // Error: show message
      const errorMsg = message || 'OAuth verification failed';
      setOauthError(errorMsg);

      setTimeout(() => setOauthError(null), GATE_TIMEOUTS.OAUTH_ERROR_MS);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [slug, onSuccess]);

  return { oauthError, buyLinkSuccess };
}
