'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Trash2, Edit, Users } from 'lucide-react';
import DataTable from './DataTable';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal';
import Toast from '../ui/Toast';
import CreateListModal from './CreateListModal';
import type { ContactListWithStats } from '@/domain/repositories/IContactListRepository';

export default function ContactListsManager() {
  const [lists, setLists] = useState<ContactListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create hash-based selection for DataTable (workaround for string UUIDs)
  const [selectedHashes, setSelectedHashes] = useState<number[]>([]);

  // Simple hash function to convert UUID string to number
  const hashStringToNumber = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Sync selectedHashes to selectedListIds
  useEffect(() => {
    const ids = selectedHashes
      .map(hash => lists.find(item => hashStringToNumber(item.list.id) === hash)?.list.id)
      .filter(Boolean) as string[];
    setSelectedListIds(ids);
  }, [selectedHashes, lists]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(
        selectedListIds.map(id => fetch(`/api/contact-lists/${id}`, { method: 'DELETE' }))
      );
      setToast({
        message: `Successfully deleted ${selectedListIds.length} list(s)`,
        type: 'success',
      });
      setSelectedListIds([]);
      setShowDeleteModal(false);
      fetchLists();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'List Name',
      accessor: (item: ContactListWithStats) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: item.list.color }}
          >
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1c1c1c]">{item.list.name}</div>
            {item.list.description && (
              <div className="text-xs text-gray-500">{item.list.description}</div>
            )}
          </div>
        </div>
      ),
      sortKey: (item: ContactListWithStats) => item.list.name.toLowerCase(),
    },
    {
      header: 'Contacts',
      accessor: (item: ContactListWithStats) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{item.totalContacts}</span>
          <span className="text-xs text-gray-400">
            ({item.subscribedContacts} subscribed)
          </span>
        </div>
      ),
      sortKey: (item: ContactListWithStats) => item.totalContacts,
    },
    {
      header: 'Created',
      accessor: (item: ContactListWithStats) => (
        <div className="text-sm text-gray-600">
          {new Date(item.list.createdAt).toLocaleDateString()}
        </div>
      ),
      sortKey: (item: ContactListWithStats) => new Date(item.list.createdAt).getTime(),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={lists}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search lists..."
        searchFields={(item) => item.list.name}
        emptyMessage="No lists yet. Create your first list to organize your contacts."
        emptyIcon={<FolderOpen className="w-12 h-12 text-gray-300" />}
        selectable={true}
        getItemId={(item) => hashStringToNumber(item.list.id)}
        selectedIds={selectedHashes}
        onSelectionChange={setSelectedHashes}
        actions={
          <>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200 text-xs font-bold active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New List
            </button>
            {selectedListIds.length > 0 && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200 text-xs font-bold active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedListIds.length})
              </button>
            )}
          </>
        }
      />

      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLists();
            setToast({ message: 'List created successfully', type: 'success' });
          }}
        />
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !deleting && setShowDeleteModal(false)}
          title="Delete Lists"
          size="md"
          closeOnBackdropClick={!deleting}
        >
          <ModalBody>
            <p className="text-gray-700">
              Are you sure you want to delete {selectedListIds.length} list(s)? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </ModalFooter>
        </Modal>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
