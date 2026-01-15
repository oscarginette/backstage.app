import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useEmailPreview Hook
 *
 * Debounced email preview fetcher to prevent flickering on every keystroke.
 * Implements Single Responsibility Principle (SRP): Only handles preview logic.
 *
 * Features:
 * - 300ms debounce delay to batch rapid updates
 * - Automatic cleanup of pending requests
 * - Loading state management
 * - Error handling
 *
 * IMPORTANT: Uses primitive values as dependencies to avoid infinite loop.
 * Passing objects as dependencies causes React to see new references on every render.
 *
 * @param trackName - Track name for preview
 * @param trackUrl - Track URL for preview
 * @param coverImage - Cover image URL
 * @param greeting - Optional custom greeting text
 * @param message - Optional custom message text
 * @param signature - Optional custom signature text
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns { previewHtml, isLoadingPreview }
 *
 * @example
 * const { previewHtml, isLoadingPreview } = useEmailPreview(
 *   'My Track',
 *   'https://...',
 *   coverImage || '',
 *   greeting,
 *   message,
 *   signature
 * );
 */
export function useEmailPreview(
  trackName: string,
  trackUrl: string,
  coverImage: string,
  greeting?: string,
  message?: string,
  signature?: string,
  debounceMs: number = 300
) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPreview = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/test-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName,
          trackUrl,
          coverImage,
          customContent: greeting || message || signature
            ? { greeting, message, signature }
            : undefined
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      setPreviewHtml(data.html || '');
    } catch (error) {
      // Ignore abort errors (expected when user types rapidly)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching preview:', error);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  }, [trackName, trackUrl, coverImage, greeting, message, signature]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: Wait for user to stop typing
    timeoutRef.current = setTimeout(() => {
      fetchPreview();
    }, debounceMs);

    // Cleanup on unmount or params change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPreview, debounceMs]);

  return { previewHtml, isLoadingPreview };
}
