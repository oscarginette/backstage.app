/**
 * Download Gate UI Types
 *
 * Type definitions for UI layer (presentation).
 * These types are specific to the client-side gate experience.
 *
 * Clean Architecture: Domain types layer (UI-specific)
 */

import { GateStep } from './download-gate-steps';

/**
 * Download Gate entity for UI
 * Represents a gate as displayed to the end user
 */
export interface DownloadGate {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  artworkUrl?: string;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  requireInstagramFollow: boolean;
  instagramProfileUrl?: string;
}

/**
 * Download Submission state for UI
 * Tracks user progress through gate requirements
 */
export interface DownloadSubmission {
  submissionId: string;
  email: string;
  soundcloudRepostVerified: boolean;
  soundcloudFollowVerified: boolean;
  spotifyConnected: boolean;
  instagramClickTracked: boolean;
  downloadCompleted: boolean;
  instagramClickTrackedAt?: Date;
}

/**
 * Email submission form data
 */
export interface EmailSubmitData {
  email: string;
  firstName?: string;
  consentMarketing: boolean;
}

/**
 * Progress step configuration for UI tracker
 */
export interface ProgressStep {
  id: GateStep;
  label: string;
  completed: boolean;
  current: boolean;
}

/**
 * OAuth callback URL parameters
 */
export interface OAuthCallbackParams {
  oauth?: string | null;
  provider?: string | null;
  message?: string | null;
  buyLink?: string | null;
}
