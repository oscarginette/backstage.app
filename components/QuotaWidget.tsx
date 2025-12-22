/**
 * QuotaWidget Component
 *
 * Displays user's current email quota status with visual indicators.
 * Shows warning when remaining quota is low.
 *
 * Clean Code: Client component with clear separation of concerns.
 */

'use client';

import { useEffect, useState } from 'react';

interface QuotaStatus {
  emailsSentToday: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string;
  allowed: boolean;
}

export default function QuotaWidget() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/quota');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch quota');
      }

      const data = await response.json();
      setQuota(data);
    } catch (err) {
      console.error('QuotaWidget fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quota');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 p-4 bg-red-50 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchQuota}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!quota) {
    return null;
  }

  const percentage = (quota.emailsSentToday / quota.monthlyLimit) * 100;
  const isLowQuota = quota.remaining < 10;
  const isVeryLowQuota = quota.remaining < 5;
  const isExceeded = !quota.allowed;

  const getStatusColor = () => {
    if (isExceeded) return 'text-red-600';
    if (isVeryLowQuota) return 'text-red-500';
    if (isLowQuota) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isExceeded) return 'bg-red-500';
    if (isVeryLowQuota) return 'bg-red-400';
    if (isLowQuota) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Email Quota</h3>
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {quota.emailsSentToday} / {quota.monthlyLimit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {quota.remaining} remaining
        </span>
        <span>
          Resets {new Date(quota.resetDate).toLocaleDateString()}
        </span>
      </div>

      {/* Warning messages */}
      {isExceeded && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          Daily limit reached. Quota resets tomorrow.
        </div>
      )}

      {!isExceeded && isVeryLowQuota && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          Warning: Only {quota.remaining} emails remaining today!
        </div>
      )}

      {!isExceeded && !isVeryLowQuota && isLowQuota && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Low quota: {quota.remaining} emails remaining.
        </div>
      )}
    </div>
  );
}
