'use client';

import { useState } from 'react';
import { Plus, Mail, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsFormActions } from '@/components/settings/SettingsFormActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CollapsibleInfoCard } from '@/components/ui/CollapsibleInfoCard';
import { LAYOUT_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';
import AddDomainModal from './AddDomainModal';
import DomainCard from './DomainCard';
import type { SendingDomain } from '@/domain/entities/SendingDomain';

interface SendingDomainsClientProps {
  initialDomains: ReturnType<SendingDomain['toJSON']>[];
  currentSenderEmail: string | null;
  currentSenderName: string | null;
}

/**
 * SendingDomainsClient Component
 *
 * Unified component for managing sending domains AND sender email.
 * Consolidates domain verification + sender email configuration in one page.
 *
 * Features:
 * - Configure sender email (requires verified domain)
 * - Add/verify/delete domains
 * - Real-time domain validation
 * - Empty states and error handling
 *
 * Architecture:
 * - SRP: Handles both domain and sender email presentation
 * - Uses design system components (SettingsSection, SettingsFormActions)
 * - Follows Clean Architecture (API calls via endpoints)
 * - Consistent with other settings pages (Profile, Email Signature, etc.)
 */
export default function SendingDomainsClient({
  initialDomains,
  currentSenderEmail,
  currentSenderName
}: SendingDomainsClientProps) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [showAddModal, setShowAddModal] = useState(false);

  // Sender email state
  const [senderEmail, setSenderEmail] = useState(currentSenderEmail || '');
  const [senderName, setSenderName] = useState(currentSenderName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper: Extract domain from email
  const extractDomain = (email: string): string | null => {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase().trim() : null;
  };

  // Helper: Check if email domain is verified
  const isEmailDomainVerified = (): boolean => {
    if (!senderEmail) return true; // Empty is valid
    const domain = extractDomain(senderEmail);
    if (!domain) return false;
    return verifiedDomains.includes(domain);
  };

  // Helper: Format sender preview
  const previewSender = (): string => {
    if (!senderEmail) return 'The Backstage <noreply@thebackstage.app>';
    const name = senderName || 'Artist';
    return `${name} <${senderEmail}>`;
  };

  // Domain handlers
  const handleDomainAdded = (newDomain: ReturnType<SendingDomain['toJSON']>) => {
    setDomains([newDomain, ...domains]);
    setShowAddModal(false);
  };

  const handleDomainUpdated = (updatedDomain: ReturnType<SendingDomain['toJSON']>) => {
    setDomains(domains.map(d => d.id === updatedDomain.id ? updatedDomain : d));
  };

  const handleDomainDeleted = (domainId: number) => {
    setDomains(domains.filter(d => d.id !== domainId));
  };

  // Sender email handlers
  const handleSaveSenderEmail = async () => {
    setSaveSuccess(false);
    setSaveError(null);

    // Validate domain is verified
    if (senderEmail && !isEmailDomainVerified()) {
      setSaveError('Email domain must be verified first. Add and verify your domain below.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/sender-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: senderEmail || null,
          senderName: senderName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error || 'Failed to update sender email');
        return;
      }

      setSaveSuccess(true);
      router.refresh(); // Refresh server data
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSenderEmail = async () => {
    setSenderEmail('');
    setSenderName('');
    setSaveSuccess(false);
    setSaveError(null);

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/sender-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: null,
          senderName: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.error || 'Failed to clear sender email');
        return;
      }

      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get verified domains list
  const verifiedDomains = domains
    .filter(d => d.status === 'verified')
    .map(d => d.domain);

  return (
    <div className={LAYOUT_STYLES.spacing.section}>
      {/* Header Section */}
      <SettingsPageHeader
        title="Senders & Domains"
        description="Configure your sender email and verify domains to send from your own address"
      />

      {/* Sender Email Configuration Section */}
      <SettingsSection
        title="Sender Email"
        description="Configure the email address and name that appears as the sender of your campaigns"
      >
        {/* Email Preview */}
        {senderEmail && (
          <div className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <p className={TEXT_STYLES.body.muted}>
              Email preview
            </p>
            <p className={cn(TEXT_STYLES.body.base, 'font-mono mt-1')}>
              {previewSender()}
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label htmlFor="senderEmail" className={cn(TEXT_STYLES.label.default, 'block mb-2')}>
              Sender Email
            </label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@yourdomain.com"
              disabled={isSaving}
            />
            {senderEmail && !isEmailDomainVerified() && (
              <div className="mt-2 flex items-start gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className={TEXT_STYLES.body.muted}>
                  This domain is not verified. Please add and verify it below.
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="senderName" className={cn(TEXT_STYLES.label.default, 'block mb-2')}>
              Sender Name (Optional)
            </label>
            <Input
              id="senderName"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your Brand"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className={cn(TEXT_STYLES.body.subtle, 'text-red-800 dark:text-red-200')}>
              {saveError}
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6">
          {verifiedDomains.length > 0 ? (
            <CollapsibleInfoCard
              title="Verified Domains"
              variant="blue"
            >
              <div>
                <p className={cn(TEXT_STYLES.body.subtle, 'mb-2')}>
                  You can use any email address from these domains:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {verifiedDomains.map((domain) => (
                    <li key={domain} className={TEXT_STYLES.body.subtle}>
                      {domain}
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleInfoCard>
          ) : (
            <CollapsibleInfoCard
              title="No verified domains yet"
              variant="yellow"
            >
              <div>
                <p className={cn(TEXT_STYLES.body.subtle, 'mb-2')}>
                  Add and verify a domain below to use a custom sender email.
                </p>
                <p className={TEXT_STYLES.body.subtle}>
                  Without a verified domain, emails will be sent from <code>noreply@thebackstage.app</code>.
                </p>
              </div>
            </CollapsibleInfoCard>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          <SettingsFormActions
            isSaving={isSaving}
            showSuccess={saveSuccess}
            onSave={handleSaveSenderEmail}
            type="button"
            saveText="Save Sender Email"
            savedText="Sender email updated successfully"
          >
            {(currentSenderEmail || senderEmail) && (
              <Button
                variant="ghost"
                size="md"
                onClick={handleClearSenderEmail}
                disabled={isSaving}
              >
                Clear
              </Button>
            )}
          </SettingsFormActions>
        </div>
      </SettingsSection>

      {/* Sending Domains Section */}
      <SettingsSection
        title="Sending Domains"
        description="Add and verify domains to send emails from your own addresses"
      >
        <div className="flex justify-end mb-6">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add domain
          </Button>
        </div>

        {/* Domain List */}
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-accent/60" />
            </div>
            <h3 className="text-lg font-serif text-foreground mb-2">
              No domains added yet
            </h3>
            <p className="text-sm text-foreground/60 mb-6">
              Add your first domain to start sending emails from your own address
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add your first domain
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {domains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  onUpdate={handleDomainUpdated}
                  onDelete={handleDomainDeleted}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </SettingsSection>

      {/* Add Domain Modal */}
      <AddDomainModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleDomainAdded}
      />
    </div>
  );
}
