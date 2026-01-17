/**
 * useDownloadGate Hook
 *
 * Fetches and manages download gate data.
 * Handles loading, error, and success states.
 *
 * Single Responsibility: Gate data fetching only
 */

import { useState, useEffect } from 'react';
import { DownloadGate } from '@/domain/types/download-gate-ui';

interface UseDownloadGateResult {
  gate: DownloadGate | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetch download gate by slug
 *
 * @param slug - Gate slug from URL
 * @returns Gate data, loading state, and error state
 */
export function useDownloadGate(slug: string): UseDownloadGateResult {
  const [gate, setGate] = useState<DownloadGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGate = async () => {
      try {
        const res = await fetch(`/api/gate/${slug}`);

        if (!res.ok) {
          throw new Error('Gate not found');
        }

        const data = await res.json();
        setGate(data.gate);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load gate'));
      } finally {
        setLoading(false);
      }
    };

    fetchGate();
  }, [slug]);

  return { gate, loading, error };
}
