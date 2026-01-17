/**
 * useOAuthCallback Hook
 *
 * Handles OAuth redirect callback from SoundCloud/Spotify.
 * Parses URL parameters and triggers success/error handlers.
 *
 * Single Responsibility: OAuth callback handling
 */

import { useEffect, useState } from 'react';
import { OAUTH_STATUS, GATE_TIMEOUTS } from '@/domain/types/download-gate-steps';

interface UseOAuthCallbackResult {
  oauthError: string | null;
  buyLinkSuccess: boolean;
}

interface UseOAuthCallbackProps {
  onSuccess: (provider: string) => void;
}

/**
 * Handle OAuth callback from URL parameters
 *
 * @param onSuccess - Callback when OAuth succeeds (receives provider name)
 * @returns OAuth error message and buy link success flag
 */
export function useOAuthCallback({ onSuccess }: UseOAuthCallbackProps): UseOAuthCallbackResult {
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [buyLinkSuccess, setBuyLinkSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('oauth');
    const provider = params.get('provider');
    const message = params.get('message');
    const buyLink = params.get('buyLink');

    if (status === OAUTH_STATUS.SUCCESS && provider) {
      console.log('[useOAuthCallback] OAuth success detected, waiting for submission to load...');

      // Wait a bit for submission to load from localStorage before triggering callback
      setTimeout(() => {
        console.log('[useOAuthCallback] Triggering onSuccess callback');
        onSuccess(provider);
      }, 100);

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
  }, [onSuccess]);

  return { oauthError, buyLinkSuccess };
}
