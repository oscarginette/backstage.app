/**
 * Sender Email Settings Client Component
 *
 * Form for configuring custom sender email and name.
 * Validates domain is verified before allowing save.
 *
 * Architecture:
 * - Uses SettingsPageHeader for consistent header
 * - Uses SettingsSection for card wrappers
 * - Uses Input component for form fields
 * - Uses SettingsFormActions for save button + success message
 * - Uses Button component for secondary actions
 * - Uses design tokens for all styling
 *
 * Features:
 * - Domain verification check
 * - Real-time email preview
 * - Success/error messaging
 * - Clear/reset functionality
 * - Info cards with verified domains list
 * - Full dark mode support via design system
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsFormActions } from '@/components/settings/SettingsFormActions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CollapsibleInfoCard } from '@/components/ui/CollapsibleInfoCard';
import { LAYOUT_STYLES, TEXT_STYLES, CARD_STYLES, cn } from '@/domain/types/design-tokens';

interface SenderEmailSettingsProps {
  currentSenderEmail: string | null;
  currentSenderName: string | null;
  verifiedDomains: string[];
}

export default function SenderEmailSettings({
  currentSenderEmail,
  currentSenderName,
  verifiedDomains,
}: SenderEmailSettingsProps) {
  const router = useRouter();
  const [senderEmail, setSenderEmail] = useState(currentSenderEmail || '');
  const [senderName, setSenderName] = useState(currentSenderName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props when they change (after router.refresh())
  useEffect(() => {
    console.log('[SenderEmailSettings] useEffect triggered - Props changed:', {
      currentSenderEmail,
      currentSenderName,
      previousStateEmail: senderEmail,
      previousStateName: senderName,
    });

    setSenderEmail(currentSenderEmail || '');
    setSenderName(currentSenderName || '');

    console.log('[SenderEmailSettings] State updated to match props');
  }, [currentSenderEmail, currentSenderName]);

  // Extract domain from email
  const extractDomain = (email: string): string | null => {
    const match = email.match(/@(.+)$/);
    return match ? match[1] : null;
  };

  // Check if email domain is verified
  const isEmailDomainVerified = (email: string): boolean => {
    if (!email || !email.includes('@')) return false;
    const domain = extractDomain(email);
    return domain ? verifiedDomains.includes(domain) : false;
  };

  // Preview formatted sender
  const previewSender = (): string => {
    if (!senderEmail.trim()) {
      return 'The Backstage <noreply@thebackstage.app>';
    }
    const name = senderName.trim() || 'Artist';
    return `${name} <${senderEmail.trim()}>`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);

    console.log('[SenderEmailSettings] handleSave START:', {
      senderEmail: senderEmail.trim(),
      senderName: senderName.trim() || null,
    });

    // Validation
    if (!senderEmail.trim()) {
      setError('Sender email is required');
      return;
    }

    if (!senderEmail.includes('@')) {
      setError('Invalid email format');
      return;
    }

    // Check if domain is verified
    if (!isEmailDomainVerified(senderEmail)) {
      const domain = extractDomain(senderEmail);
      setError(
        `Domain "${domain}" is not verified. Please verify your domain at /settings/sending-domains first.`
      );
      return;
    }

    setIsSaving(true);

    try {
      console.log('[SenderEmailSettings] Sending PATCH request...');

      const response = await fetch('/api/user/sender-email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderEmail: senderEmail.trim(),
          senderName: senderName.trim() || null,
        }),
      });

      console.log('[SenderEmailSettings] Response status:', response.status);

      const data = await response.json();
      console.log('[SenderEmailSettings] Response data:', data);

      if (!response.ok) {
        console.error('[SenderEmailSettings] Save failed:', data);
        setError(data.error || 'Failed to save settings');
        return;
      }

      console.log('[SenderEmailSettings] Save successful, calling router.refresh()');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Refresh the server component to get new data
      router.refresh();

      console.log('[SenderEmailSettings] router.refresh() called');
    } catch (error) {
      console.error('[SenderEmailSettings] Exception during save:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setError(null);
    setShowSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/sender-email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderEmail: null,
          senderName: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to clear settings');
        return;
      }

      setSenderEmail('');
      setSenderName('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      router.refresh();
    } catch (error) {
      console.error('Error clearing sender email:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={LAYOUT_STYLES.spacing.section}>
      {/* Page Header */}
      <SettingsPageHeader
        title="Sender Email Settings"
        description="Configure the email address and name that appears in the 'From' field of your newsletters"
      />

      {/* Info Card - About Sender Email (Collapsible) */}
      <CollapsibleInfoCard
        title="About Sender Email"
        variant="blue"
        icon={Info}
        defaultOpen={false}
      >
        <ul className="space-y-1">
          <li>• Your sender email appears in the "From" field of newsletters</li>
          <li>• You can only use domains you've verified in Sending Domains</li>
          <li>• If not configured, emails will be sent from: The Backstage &lt;noreply@thebackstage.app&gt;</li>
        </ul>
      </CollapsibleInfoCard>

      {/* Verified Domains Card */}
      {verifiedDomains.length > 0 ? (
        <div
          className={cn(
            CARD_STYLES.base,
            CARD_STYLES.background.default,
            CARD_STYLES.border.default,
            CARD_STYLES.padding.md,
            'bg-green-50/90 dark:bg-green-950/30 border-green-200 dark:border-green-800'
          )}
        >
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className={cn(TEXT_STYLES.heading.h3, 'text-green-900 dark:text-green-100 mb-2')}>
                Verified Domains
              </h3>
              <p className={cn(TEXT_STYLES.body.base, 'text-green-800 dark:text-green-200 mb-2')}>
                You can use email addresses from these domains:
              </p>
              <ul className={cn(TEXT_STYLES.body.base, 'text-green-700 dark:text-green-300 space-y-1')}>
                {verifiedDomains.map(domain => (
                  <li key={domain}>• {domain}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            CARD_STYLES.base,
            CARD_STYLES.background.default,
            CARD_STYLES.border.default,
            CARD_STYLES.padding.md,
            'bg-yellow-50/90 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
          )}
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className={cn(TEXT_STYLES.heading.h3, 'text-yellow-900 dark:text-yellow-100 mb-2')}>
                No Verified Domains
              </h3>
              <p className={cn(TEXT_STYLES.body.base, 'text-yellow-800 dark:text-yellow-200 mb-2')}>
                You need to verify a domain before you can configure a custom sender email.
              </p>
              <a
                href="/settings/sending-domains"
                className={cn(
                  TEXT_STYLES.body.base,
                  'text-yellow-700 dark:text-yellow-300 underline hover:no-underline font-medium'
                )}
              >
                Go to Sending Domains →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSave} className={LAYOUT_STYLES.spacing.section}>
        <SettingsSection>
          <div className="grid grid-cols-1 gap-6">
            {/* Sender Email Input */}
            <Input
              label="Sender Email Address"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="info@thebackstage.app"
              helperText="Must use a verified domain"
              disabled={isSaving || verifiedDomains.length === 0}
              focusVariant="primary"
            />

            {/* Sender Name Input */}
            <Input
              label="Sender Name (optional)"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your Artist Name"
              helperText="The name that appears before the email address"
              disabled={isSaving || verifiedDomains.length === 0}
              focusVariant="primary"
            />

            {/* Preview */}
            <div
              className={cn(
                CARD_STYLES.base,
                CARD_STYLES.background.subtle,
                CARD_STYLES.border.subtle,
                CARD_STYLES.padding.sm
              )}
            >
              <p className={cn(TEXT_STYLES.label.default, 'mb-1')}>Preview:</p>
              <p className={cn(TEXT_STYLES.body.base, 'font-mono text-foreground/80')}>
                From: {previewSender()}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={cn(
                  CARD_STYLES.base,
                  CARD_STYLES.border.default,
                  CARD_STYLES.padding.sm,
                  'bg-red-50/90 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                )}
              >
                <p className={cn(TEXT_STYLES.body.base, 'text-red-800 dark:text-red-200')}>{error}</p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Form Actions */}
        <SettingsFormActions
          isSaving={isSaving}
          showSuccess={showSuccess}
          type="submit"
          saveText="Save Settings"
          savingText="Saving..."
          savedText="Settings saved!"
        >
          {/* Clear Button (only show if there's current data) */}
          {(currentSenderEmail || senderEmail) && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClear}
              disabled={isSaving}
            >
              Clear
            </Button>
          )}
        </SettingsFormActions>
      </form>
    </div>
  );
}
