'use client';

import { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';

interface AddContactsToListModalProps {
  contactIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContactsToListModal({
  contactIds,
  onClose,
  onSuccess,
}: AddContactsToListModalProps) {
  const [lists, setLists] = useState<ContactListWithStats[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) return;

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/contact-lists/${selectedListId}/add-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add contacts');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Add ${contactIds.length} Contact(s) to List`}
      size="md"
      closeOnBackdropClick={!adding}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="text-sm text-gray-500">
                No lists available. Create a list first.
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select List
                </label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5500] focus:border-[#FF5500]"
                  disabled={adding}
                >
                  <option value="">-- Select a list --</option>
                  {lists.map((item) => (
                    <option key={item.list.id} value={item.list.id}>
                      {item.list.name} ({item.totalContacts} contacts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={adding || !selectedListId}
            className="px-4 py-2 bg-[#FF5500] text-white rounded-lg hover:bg-[#FF5500]/90 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add to List'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
