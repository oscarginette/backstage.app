'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import { formatCampaignDate } from '@/lib/date-utils';
import CampaignMetadata from '@/components/dashboard/shared/CampaignMetadata';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorState from '@/components/ui/ErrorState';
import EmailPreview from '@/components/ui/EmailPreview';

interface CampaignPreviewModalProps {
  executionLogId: number;
  onClose: () => void;
}

interface CampaignPreviewData {
  id: string;
  templateId?: string | null;
  trackId?: string | null;
  subject: string;
  htmlContent: string;
  sentAt: string;
  emailsSent: number;
  metadata: {
    greeting?: string;
    message?: string;
    signature?: string;
    coverImageUrl?: string;
    trackTitle?: string;
    trackUrl?: string;
  };
}

/**
 * CampaignPreviewModal
 *
 * Read-only modal for previewing historical campaigns.
 * Displays campaign HTML content and metadata safely using an iframe.
 */
export default function CampaignPreviewModal({
  executionLogId,
  onClose,
}: CampaignPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignPreviewData | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCampaignPreview();
  }, [executionLogId]);

  const fetchCampaignPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/execution-history/${executionLogId}/preview`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch campaign preview');
      }

      const data = await response.json();

      // Handle nested data structure: { success: true, data: { campaign: {...} } }
      const campaign = data.data?.campaign || data.campaign;

      if (campaign) {
        setCampaign(campaign);
      } else {
        throw new Error('No campaign data received');
      }
    } catch (err) {
      console.error('Error fetching campaign preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign preview');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!campaign) return;

    setCreatingDraft(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: campaign.templateId || undefined,
          trackId: campaign.trackId || undefined,
          subject: campaign.subject,
          greeting: campaign.metadata?.greeting || '',
          message: campaign.metadata?.message || '',
          signature: campaign.metadata?.signature || '',
          coverImageUrl: campaign.metadata?.coverImageUrl || null,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create draft');
      }

      const data = await response.json();

      if (data.success && data.data?.campaign?.id) {
        // Close preview modal
        onClose();
        // Navigate to dashboard with new draft open for editing
        router.push(`/dashboard?tab=engagement&editDraft=${data.data.campaign.id}`);
      } else {
        throw new Error(data.error || 'Failed to create draft');
      }
    } catch (err) {
      console.error('Error creating draft:', err);
      alert('Failed to create draft from campaign');
    } finally {
      setCreatingDraft(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="6xl"
      customHeader={
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-1">
                Campaign Preview
              </h2>
              {campaign && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    {campaign.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatCampaignDate(campaign.sentAt)} to {campaign.emailsSent} contact
                    {campaign.emailsSent !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      }
    >
      {/* Scrollable Content */}
      <ModalBody className="bg-muted">
        {loading ? (
          <LoadingSpinner size="lg" message="Loading campaign preview..." centered />
        ) : error ? (
          <ErrorState
            title="Failed to load preview"
            message={error}
            onRetry={fetchCampaignPreview}
            centered
          />
        ) : campaign ? (
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
            {/* Campaign Metadata */}
            {campaign.metadata && (
              <CampaignMetadata
                metadata={campaign.metadata}
                visibleFields={['track', 'greeting', 'signature']}
              />
            )}

            {/* HTML Preview */}
            <EmailPreview
              htmlContent={campaign.htmlContent}
              height="h-[500px]"
              sandbox={true}
            />
          </div>
        ) : null}
      </ModalBody>

      {/* Fixed Footer */}
      <ModalFooter>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Click Edit to create a new draft from this campaign
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={creatingDraft}
              className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleCreateDraft}
              disabled={creatingDraft || !campaign}
              className="px-6 py-2.5 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creatingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Creating Draft...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
