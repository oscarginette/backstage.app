'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface WarmupProgressCardProps {
  campaignId: string;
  onRefresh?: () => void;
}

interface WarmupStatus {
  warmupEnabled: boolean;
  currentDay: number;
  isComplete: boolean;
  isPaused: boolean;
  pauseReason: string | null;
  progress: {
    totalContacts: number;
    sentSoFar: number;
    remainingContacts: number;
    percentComplete: number;
  };
  health: {
    bounceRate: number;
    complaintRate: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  nextBatch: {
    day: number;
    quota: number;
  } | null;
}

export function WarmupProgressCard({ campaignId, onRefresh }: WarmupProgressCardProps) {
  const [status, setStatus] = useState<WarmupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch warm-up status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/warmup/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Send next batch
  const handleSendBatch = async () => {
    try {
      setSending(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/warmup/send-batch`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send batch');
      }

      alert(`✅ Batch sent successfully!\n\n` +
        `Sent: ${data.batchSent} emails\n` +
        `Failed: ${data.batchFailed}\n` +
        `Warm-up Day: ${data.warmupDay}\n` +
        `${data.isWarmupComplete ? '🎉 Warm-up Complete!' : `Next quota: ${data.nextBatchQuota}`}`
      );

      // Refresh status
      await fetchStatus();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  // Enable warm-up
  const handleEnableWarmup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/warmup/start`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable warm-up');
      }

      alert(`✅ Warm-up enabled!\n\n` +
        `Total contacts: ${data.warmupSchedule.totalContacts}\n` +
        `Estimated days: ${data.warmupSchedule.estimatedDays}\n\n` +
        `Ready to send first batch.`
      );

      await fetchStatus();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Pause warm-up
  const handlePause = async () => {
    const reason = prompt('Reason for pausing warm-up:');
    if (!reason) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/warmup/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pause warm-up');
      }

      alert('⏸️ Warm-up paused');
      await fetchStatus();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Resume warm-up
  const handleResume = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/campaigns/${campaignId}/warmup/resume`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume warm-up');
      }

      alert('▶️ Warm-up resumed');
      await fetchStatus();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load status on mount
  if (!status && !loading && !error) {
    fetchStatus();
  }

  if (loading && !status) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500">
          Loading warm-up status...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <Button onClick={fetchStatus} variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!status) return null;

  // Not enabled yet
  if (!status.warmupEnabled) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="font-semibold mb-2">Warm-up Not Enabled</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enable gradual warm-up to build sender reputation over 7 days.
          </p>
          <Button onClick={handleEnableWarmup} disabled={loading}>
            Enable Warm-up
          </Button>
        </div>
      </Card>
    );
  }

  // Warm-up complete
  if (status.isComplete) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="font-semibold text-green-600 mb-2">
            🎉 Warm-up Complete!
          </h3>
          <p className="text-sm">
            All {status.progress.totalContacts} contacts have been sent.
          </p>
        </div>
      </Card>
    );
  }

  // Active warm-up
  const healthColor = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  }[status.health.status];

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Warm-up Progress (Day {status.currentDay}/7)
          </h3>
          {status.isPaused && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              PAUSED
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{status.progress.sentSoFar} / {status.progress.totalContacts} sent</span>
            <span>{status.progress.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${status.progress.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Health Status */}
        <div className="mb-4 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-600">Health:</span>
            <span className={`font-medium ${healthColor}`}>
              {status.health.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Bounce: {status.health.bounceRate}% | Complaints: {status.health.complaintRate}%
          </div>
        </div>

        {/* Next Batch Info */}
        {status.nextBatch && !status.isPaused && (
          <div className="mb-4 text-sm bg-blue-50 p-3 rounded">
            <p className="font-medium">Next Batch (Day {status.nextBatch.day}):</p>
            <p className="text-gray-600">{status.nextBatch.quota} contacts</p>
          </div>
        )}

        {/* Pause Reason */}
        {status.isPaused && status.pauseReason && (
          <div className="mb-4 text-sm bg-yellow-50 p-3 rounded">
            <p className="font-medium text-yellow-800">Paused:</p>
            <p className="text-yellow-700">{status.pauseReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!status.isPaused ? (
            <>
              <Button
                onClick={handleSendBatch}
                disabled={sending}
                className="flex-1"
              >
                {sending ? 'Sending...' : 'Send Next Batch'}
              </Button>
              <Button
                onClick={handlePause}
                variant="secondary"
                size="sm"
              >
                Pause
              </Button>
            </>
          ) : (
            <Button
              onClick={handleResume}
              disabled={loading}
              className="flex-1"
            >
              Resume Warm-up
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
