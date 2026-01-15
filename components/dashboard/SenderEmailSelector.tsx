'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PATHS } from '@/lib/paths';
import { DOMAIN_STATUS } from '@/domain/entities/SendingDomain';

interface SendingDomain {
  id: number;
  domain: string;
  status: string;
  isVerified: boolean;
}

interface SenderEmailSelectorProps {
  selectedEmail: string;
  onChange: (email: string) => void;
  userSenderName?: string;
}

/**
 * SenderEmailSelector Component
 *
 * Allows users to choose which verified domain to send emails from.
 * Fetches verified domains from API and displays them in a dropdown.
 *
 * Features:
 * - Fetches verified sending domains for the authenticated user
 * - Shows default sender (noreply@thebackstage.app) as fallback
 * - Displays formatted sender with name (e.g., "Artist Name <info@geebeat.com>")
 * - Links to settings page if no verified domains exist
 * - Follows existing design patterns from EmailContentEditor
 *
 * SOLID Compliance:
 * - SRP: Only handles sender email selection UI
 * - OCP: Easy to extend with additional email options
 * - DIP: Depends on API contract, not implementation
 */
export default function SenderEmailSelector({
  selectedEmail,
  onChange,
  userSenderName,
}: SenderEmailSelectorProps) {
  const [verifiedDomains, setVerifiedDomains] = useState<SendingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerifiedDomains();
  }, []);

  const fetchVerifiedDomains = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sending-domains');

      if (!response.ok) {
        throw new Error('Failed to fetch sending domains');
      }

      const data = await response.json();

      // Filter for verified domains only
      const verified = data.domains?.filter(
        (domain: SendingDomain) => domain.status === DOMAIN_STATUS.VERIFIED
      ) || [];

      setVerifiedDomains(verified);
    } catch (err) {
      console.error('[SenderEmailSelector] Error fetching domains:', err);
      setError('Failed to load verified domains');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format sender email with name
   * @param email - Email address
   * @returns Formatted string (e.g., "Artist Name <email>" or just "email")
   */
  const formatSenderOption = (email: string): string => {
    if (!userSenderName) {
      return email;
    }
    return `${userSenderName} <${email}>`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground/70 font-serif">
        Sender Email
        <span className="text-xs text-muted-foreground ml-2 font-sans font-normal">
          Choose which email address to send from
        </span>
      </label>

      {loading ? (
        <div className="w-full px-4 py-3 rounded-xl border border-border bg-background text-muted-foreground flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span className="text-sm">Loading verified domains...</span>
        </div>
      ) : error ? (
        <div className="w-full px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 text-sm">
          {error}
        </div>
      ) : (
        <>
          <select
            value={selectedEmail}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all duration-200 shadow-sm hover:shadow-md hover:border-accent/30 cursor-pointer"
          >
            {/* Default option */}
            <option value="">
              Default (noreply@thebackstage.app)
            </option>

            {/* Verified custom domains */}
            {verifiedDomains.map((domain) => {
              const email = `info@${domain.domain}`;
              return (
                <option key={domain.id} value={email}>
                  {formatSenderOption(email)}
                </option>
              );
            })}
          </select>

          {/* Helper text */}
          {verifiedDomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verified domains yet.{' '}
              <Link
                href={PATHS.SETTINGS_SENDING_DOMAINS}
                className="text-accent hover:underline font-medium"
              >
                Add a custom domain
              </Link>{' '}
              to send from your own email address.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Emails will be sent from the selected address. Only verified domains are shown.
            </p>
          )}
        </>
      )}
    </div>
  );
}
