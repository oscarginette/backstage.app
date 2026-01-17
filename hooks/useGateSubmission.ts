/**
 * useGateSubmission Hook (Database-First)
 *
 * Fetches submission state from database via API.
 * Eliminates localStorage race conditions and enables multi-tab/device support.
 *
 * Architecture Change:
 * - OLD: localStorage as source of truth (async race conditions)
 * - NEW: Database as source of truth (via cookie + API)
 *
 * Single Responsibility: Submission state management + API synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { DownloadSubmission } from '@/domain/types/download-gate-ui';
import { GATE_STORAGE_PREFIX } from '@/domain/types/download-gate-steps';

interface UseGateSubmissionResult {
  submission: DownloadSubmission | null;
  setSubmission: (submission: DownloadSubmission | null) => void;
  updateSubmission: (updates: Partial<DownloadSubmission>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Manage gate submission with database-backed state
 *
 * @param slug - Gate slug for API endpoint
 * @returns Submission state and updater functions
 */
export function useGateSubmission(slug: string): UseGateSubmissionResult {
  const [submission, setSubmissionState] = useState<DownloadSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Migration: Clean up old localStorage data (one-time)
  useEffect(() => {
    const oldKey = `${GATE_STORAGE_PREFIX}${slug}`;
    if (localStorage.getItem(oldKey)) {
      console.log('[useGateSubmission] Migrating from localStorage to database-backed state');
      localStorage.removeItem(oldKey);
    }
  }, [slug]);

  // Fetch submission from API (database-backed)
  useEffect(() => {
    let mounted = true;

    async function fetchSubmission() {
      try {
        const response = await fetch(`/api/gate/${slug}/submission`, {
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }

        const data = await response.json();

        if (mounted) {
          setSubmissionState(data.submission);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useGateSubmission] Error fetching submission:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    fetchSubmission();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // Set submission (full replacement)
  const setSubmission = useCallback(
    (newSubmission: DownloadSubmission | null) => {
      setSubmissionState(newSubmission);
    },
    []
  );

  // Update submission (optimistic + API call)
  const updateSubmission = useCallback(
    async (updates: Partial<DownloadSubmission>) => {
      if (!submission) {
        console.warn('[useGateSubmission] Cannot update - no submission');
        return;
      }

      // Optimistic update for immediate UI feedback
      const updatedSubmission = { ...submission, ...updates };
      setSubmissionState(updatedSubmission);

      try {
        // Persist to database via API
        const response = await fetch(`/api/gate/${slug}/submission`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          throw new Error('Failed to update submission');
        }

        const data = await response.json();

        // Update with fresh data from server
        setSubmissionState(data.submission);
        setError(null);
      } catch (err) {
        console.error('[useGateSubmission] Error updating submission:', err);

        // Rollback optimistic update on error
        setSubmissionState(submission);
        setError(err instanceof Error ? err.message : 'Update failed');
      }
    },
    [slug, submission]
  );

  return { submission, setSubmission, updateSubmission, loading, error };
}
