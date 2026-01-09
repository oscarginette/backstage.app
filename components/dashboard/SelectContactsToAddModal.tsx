'use client';

import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import DataTable from './DataTable';
import { Button } from '@/components/ui/Button';
import { Users } from 'lucide-react';

interface Contact {
  id: number;
  email: string;
  subscribed: boolean;
  name?: string | null;
  createdAt?: Date;
}

interface SelectContactsToAddModalProps {
  listId: string;
  listName: string;
  existingContactIds: number[]; // Contacts already in the list
  onClose: () => void;
  onSuccess: (addedCount: number) => void;
}

export default function SelectContactsToAddModal({
  listId,
  listName,
  existingContactIds,
  onClose,
  onSuccess,
}: SelectContactsToAddModalProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContacts();
  }, []);

  const fetchAllContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setAllContacts(data.contacts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (selectedContactIds.length === 0) return;

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/contact-lists/${listId}/add-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContactIds }),
      });

      if (!response.ok) throw new Error('Failed to add contacts');

      const data = await response.json();
      onSuccess(data.addedCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const columns = [
    {
      header: 'Email',
      accessor: (contact: Contact) => (
        <div>
          <div className="text-sm font-medium text-foreground">{contact.email}</div>
          {contact.name && (
            <div className="text-xs text-foreground/60">{contact.name}</div>
          )}
          {existingContactIds.includes(contact.id) && (
            <div className="text-xs text-green-600 dark:text-green-400">Already in list</div>
          )}
        </div>
      ),
      sortKey: (contact: Contact) => contact.email.toLowerCase(),
    },
    {
      header: 'Status',
      accessor: (contact: Contact) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            contact.subscribed
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {contact.subscribed ? 'Subscribed' : 'Unsubscribed'}
        </span>
      ),
      sortKey: (contact: Contact) => (contact.subscribed ? 'subscribed' : 'unsubscribed'),
    },
  ];

  // Filter out contacts already in the list for selection
  const availableContacts = allContacts?.filter(c => !existingContactIds.includes(c.id)) || [];

  return (
    <Modal
      isOpen={true}
      onClose={() => !adding && onClose()}
      title={`Add Contacts to "${listName}"`}
      size="3xl"
      closeOnBackdropClick={!adding}
    >
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <DataTable
          data={allContacts}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search contacts to add..."
          searchFields={(contact) => `${contact.email} ${contact.name || ''}`}
          emptyMessage="No contacts available to add."
          emptyIcon={<Users className="w-12 h-12 text-foreground/20" />}
          selectable={true}
          getItemId={(contact) => contact.id}
          selectedIds={selectedContactIds}
          onSelectionChange={setSelectedContactIds}
        />

        <div className="mt-4 text-sm text-foreground/60">
          {availableContacts.length} available contacts • {existingContactIds.length} already in list
        </div>
      </ModalBody>

      <ModalFooter>
        <Button onClick={onClose} disabled={adding} variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          disabled={adding || selectedContactIds.length === 0}
          loading={adding}
          variant="primary"
        >
          {adding ? 'Adding...' : `Add (${selectedContactIds.length})`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
