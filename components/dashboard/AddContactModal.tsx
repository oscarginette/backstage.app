'use client';

import { useState, FormEvent } from 'react';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * AddContactModal Component
 *
 * Modal for adding individual contacts manually.
 * Reuses existing UI components (Modal, Button, Input) following the Component Reuse System.
 *
 * Architecture:
 * - Presentation layer only (no business logic)
 * - Calls POST /api/contacts/add endpoint
 * - Backend handles validation, duplicate detection, and GDPR consent logging
 *
 * Features:
 * - Email input (required, validated)
 * - Name input (optional, max 100 chars)
 * - Subscribed checkbox (default: true)
 * - Loading state during save
 * - Error display for validation/duplicate errors
 * - Success toast with different message for "created" vs "resubscribed"
 * - Form reset after successful submission
 *
 * Reusable Components:
 * - Modal, ModalBody, ModalFooter from /components/ui/Modal.tsx
 * - Button from /components/ui/Button.tsx (with loading state)
 * - Input from /components/ui/Input.tsx (with error display)
 *
 * GDPR Compliance:
 * - Backend logs consent with IP address + user agent
 * - Source: 'manual_add' (audit trail)
 * - Action: 'subscribe' or 'resubscribe'
 */

interface AddContactModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when contact is successfully added
   * Used to refresh the contact list and show appropriate toast message
   * @param action - 'created' or 'resubscribed'
   */
  onSuccess: (action: 'created' | 'resubscribed') => void;
}

export function AddContactModal({ isOpen, onClose, onSuccess }: AddContactModalProps) {
  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribed, setSubscribed] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Handle form submission
   * Calls POST /api/contacts/add and handles response
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/contacts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          subscribed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation/duplicate errors
        if (result.error) {
          setErrors({ email: result.error });
        }
        return;
      }

      // Success - call success callback with action (will show toast and refresh list)
      const action = result.action || 'created';
      onSuccess(action);

      // Close modal
      onClose();

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error adding contact:', error);
      setErrors({ email: 'Failed to add contact. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setEmail('');
    setName('');
    setSubscribed(true);
    setErrors({});
  };

  /**
   * Handle modal close
   * Resets form when modal closes
   */
  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="Add Contact"
      subtitle="Manually add a contact to your list"
      showCloseButton={true}
      closeOnBackdropClick={!saving}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {/* Email Input */}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            helperText="Required field"
            required
            focusVariant="primary"
            disabled={saving}
            autoFocus
          />

          {/* Name Input */}
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            helperText="Optional - max 100 characters"
            focusVariant="primary"
            disabled={saving}
            maxLength={100}
          />

          {/* Subscribed Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="subscribed"
              checked={subscribed}
              onChange={(e) => setSubscribed(e.target.checked)}
              disabled={saving}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="subscribed"
              className="text-sm text-foreground select-none cursor-pointer"
            >
              Subscribed to emails
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-3 justify-end">
            {/* Cancel Button */}
            <Button
              type="button"
              onClick={handleClose}
              disabled={saving}
              variant="secondary"
            >
              Cancel
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={saving || !email.trim()}
              variant="primary"
              loading={saving}
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
