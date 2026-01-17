/**
 * useOAuthCallback Hook (Simplified)
 *
 * Handles OAuth redirect callback from SoundCloud/Spotify.
 * Parses URL parameters and triggers success/error handlers.
 *
 * Architecture Change:
 * - OLD: Directly manipulated localStorage (caused race conditions)
 * - NEW: Only parses URL params, parent component handles state updates
 *
 * Single Responsibility: OAuth callback detection and URL cleanup
 */

import { useEffect, useState } from 'react';
import { OAUTH_STATUS, GATE_TIMEOUTS } from '@/domain/types/download-gate-steps';

export interface OAuthCallbackData {
  provider: string;
  buyLinkSuccess?: boolean;
}

interface UseOAuthCallbackResult {
  oauthError: string | null;
  buyLinkSuccess: boolean;
}

interface UseOAuthCallbackProps {
  onSuccess: (data: OAuthCallbackData) => void;
}

/**
 * Handle OAuth callback from URL parameters
 *
 * @param onSuccess - Callback when OAuth succeeds (receives provider and buy link status)
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
      console.log('[useOAuthCallback] OAuth success detected:', provider);

      // SIMPLIFIED: Only notify parent component
      // Parent component will call updateSubmission via useGateSubmission
      onSuccess({
        provider,
        buyLinkSuccess: buyLink === OAUTH_STATUS.SUCCESS,
      });

      // Show buy link success message if applicable
      if (buyLink === OAUTH_STATUS.SUCCESS) {
        setBuyLinkSuccess(true);
        setTimeout(() => setBuyLinkSuccess(false), GATE_TIMEOUTS.BUY_LINK_SUCCESS_MS);
      }

      // Clean up URL (remove OAuth params)
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
