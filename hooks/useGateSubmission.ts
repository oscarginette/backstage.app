/**
 * useGateSubmission Hook
 *
 * Manages submission state with localStorage persistence.
 * Provides methods to set and update submission.
 *
 * Single Responsibility: Submission state management + persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { DownloadSubmission } from '@/domain/types/download-gate-ui';
import { GATE_STORAGE_PREFIX } from '@/domain/types/download-gate-steps';

interface UseGateSubmissionResult {
  submission: DownloadSubmission | null;
  setSubmission: (submission: DownloadSubmission | null) => void;
  updateSubmission: (updates: Partial<DownloadSubmission>) => void;
}

/**
 * Manage gate submission with localStorage sync
 *
 * @param slug - Gate slug for storage key
 * @returns Submission state and updater functions
 */
export function useGateSubmission(slug: string): UseGateSubmissionResult {
  const [submission, setSubmissionState] = useState<DownloadSubmission | null>(null);

  const storageKey = `${GATE_STORAGE_PREFIX}${slug}`;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSubmissionState(parsed);
      } catch (e) {
        console.error('Failed to parse submission from localStorage', e);
      }
    }
  }, [storageKey]);

  // Persist to localStorage when updated
  const setSubmission = useCallback(
    (newSubmission: DownloadSubmission | null) => {
      setSubmissionState(newSubmission);
      if (newSubmission) {
        localStorage.setItem(storageKey, JSON.stringify(newSubmission));
      } else {
        localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

  // Partial update helper
  const updateSubmission = useCallback(
    (updates: Partial<DownloadSubmission>) => {
      if (!submission) return;

      const updated = { ...submission, ...updates };
      setSubmission(updated);
    },
    [submission, setSubmission]
  );

  return { submission, setSubmission, updateSubmission };
}
