/**
 * useGateStepNavigation Hook
 *
 * Calculates current step based on gate requirements and submission state.
 * Pure logic - no side effects.
 *
 * Single Responsibility: Step navigation logic
 */

import { useMemo } from 'react';
import { GATE_STEPS, GateStep } from '@/domain/types/download-gate-steps';
import { DownloadGate, DownloadSubmission } from '@/domain/types/download-gate-ui';

/**
 * Determine current step in gate flow
 *
 * Logic:
 * 1. If no submission → EMAIL
 * 2. If download completed → DOWNLOAD
 * 3. Check each requirement in order (SoundCloud, Instagram, Spotify)
 * 4. Default to DOWNLOAD if all complete
 *
 * @param gate - Gate configuration
 * @param submission - Current submission state
 * @returns Current step ID
 */
export function useGateStepNavigation(
  gate: DownloadGate | null,
  submission: DownloadSubmission | null
): GateStep {
  return useMemo(() => {
    if (!gate || !submission) {
      return GATE_STEPS.EMAIL;
    }

    if (submission.downloadCompleted) {
      return GATE_STEPS.DOWNLOAD;
    }

    if (
      (gate.requireSoundcloudFollow || gate.requireSoundcloudRepost) &&
      !submission.soundcloudRepostVerified
    ) {
      return GATE_STEPS.SOUNDCLOUD;
    }

    if (gate.requireInstagramFollow && !submission.instagramClickTracked) {
      return GATE_STEPS.INSTAGRAM;
    }

    if (gate.requireSpotifyConnect && !submission.spotifyConnected) {
      return GATE_STEPS.SPOTIFY;
    }

    return GATE_STEPS.DOWNLOAD;
  }, [gate, submission]);
}
