import { useState, useCallback, useRef, useEffect } from 'react';
import { EmailContent } from '@/types/dashboard';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
  debounceMs?: number; // Debounce delay in milliseconds (default: 500)
  initialCampaignId?: string | null; // Existing campaign ID (for editing drafts)
}

export interface UseAutoSaveCampaignResult {
  campaignId: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  autoSave: (content: EmailContent) => Promise<void>;
  resetCampaignId: () => void;
}

/**
 * useAutoSaveCampaign Hook
 *
 * Provides auto-save functionality for email campaigns.
 *
 * Features:
 * - Debounced saves (500ms default)
 * - Tracks campaign ID across saves
 * - Save status indicator
 * - Last saved timestamp
 *
 * Usage:
 * ```tsx
 * // New email (creates new draft on first save)
 * const { campaignId, saveStatus, lastSavedAt, autoSave } = useAutoSaveCampaign();
 *
 * // Editing existing draft (updates existing draft)
 * const { campaignId, saveStatus, lastSavedAt, autoSave } = useAutoSaveCampaign({
 *   initialCampaignId: draft.id
 * });
 *
 * // Call autoSave on every field change
 * onChange={(e) => {
 *   setSubject(e.target.value);
 *   autoSave({ subject: e.target.value, greeting, message, signature });
 * }}
 * ```
 */
export function useAutoSaveCampaign(
  options: AutoSaveOptions = {}
): UseAutoSaveCampaignResult {
  const { debounceMs = 500, initialCampaignId = null } = options;

  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef(false);
  const pendingContentRef = useRef<EmailContent | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Perform the actual save API call
   */
  const performSave = useCallback(async (content: EmailContent, currentCampaignId: string | null) => {
    if (saveInProgressRef.current) {
      // Save already in progress, queue this content
      pendingContentRef.current = content;
      return;
    }

    saveInProgressRef.current = true;
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/campaigns/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: currentCampaignId,
          subject: content.subject,
          greeting: content.greeting,
          message: content.message,
          signature: content.signature,
          coverImageUrl: content.coverImage,
          // Include list filter if present
          ...(content.listFilter && {
            listFilterMode: content.listFilter.mode,
            listFilterIds: content.listFilter.listIds,
          }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update campaign ID (will be set on first save)
        if (result.campaignId) {
          setCampaignId(result.campaignId);
        }

        setSaveStatus('saved');
        setLastSavedAt(new Date(result.savedAt));

        console.log('[AutoSave] Success:', {
          campaignId: result.campaignId,
          isNew: result.isNew,
        });
      } else {
        console.error('[AutoSave] Failed:', result.error);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('[AutoSave] Error:', error);
      setSaveStatus('error');
    } finally {
      saveInProgressRef.current = false;

      // If there's pending content, save it now
      if (pendingContentRef.current) {
        const pendingContent = pendingContentRef.current;
        pendingContentRef.current = null;

        // Use the latest campaignId from state
        const latestCampaignId = campaignId;

        // Schedule next save
        setTimeout(() => {
          performSave(pendingContent, latestCampaignId);
        }, 100);
      }
    }
  }, [campaignId]);

  /**
   * Debounced auto-save function
   */
  const autoSave = useCallback(
    async (content: EmailContent) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performSave(content, campaignId);
      }, debounceMs);
    },
    [performSave, campaignId, debounceMs]
  );

  /**
   * Reset campaign ID (for creating a new campaign)
   */
  const resetCampaignId = useCallback(() => {
    setCampaignId(null);
    setSaveStatus('idle');
    setLastSavedAt(null);
  }, []);

  return {
    campaignId,
    saveStatus,
    lastSavedAt,
    autoSave,
    resetCampaignId,
  };
}
