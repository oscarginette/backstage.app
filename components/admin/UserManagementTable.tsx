'use client';

import { useState } from 'react';
import { UserCheck, Mail, Calendar, Users, Shield, Trash2 } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import DataTable from '@/components/dashboard/DataTable';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import ActivateSubscriptionModal from './ActivateSubscriptionModal';
import { useActivateSubscription } from '@/hooks/useActivateSubscription';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';
import { USER_ROLES } from '@/domain/types/user-roles';

interface UserQuota {
  emailsSentToday: number;
  monthlyLimit: number;
  remaining: number;
  lastResetDate: string;
}

interface UserData {
  id: number;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  subscriptionPlan: string;
  monthlyQuota: number;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  quota: UserQuota | null;
}

interface UserManagementTableProps {
  users: UserData[];
  onRefresh: () => void;
  loading?: boolean;
}

type PlanType = 'free' | 'pro' | 'business' | 'unlimited';

const PLAN_LIMITS = {
  free: { contacts: 100, emails: 1000 },
  pro: { contacts: 5000, emails: 10000 },
  business: { contacts: 25000, emails: 50000 },
  unlimited: { contacts: 999999999, emails: 999999999 },
};

export default function UserManagementTable({ users, onRefresh, loading }: UserManagementTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Inline editing state
  const [editingQuotaUserId, setEditingQuotaUserId] = useState<number | null>(null);
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(0);

  // Use custom hook for activation logic
  const { activate, loading: activating } = useActivateSubscription();

  // Handle bulk activation
  const handleActivateSubscription = async (plan: string, billingCycle: 'monthly' | 'annual', durationMonths: number) => {
    try {
      const result = await activate({
        userIds: selectedUsers,
        plan,
        billingCycle,
        durationMonths,
      });

      if (result.success) {
        setToast({
          message: `Successfully activated ${result.activatedCount} user(s) with ${plan} plan`,
          type: 'success',
        });

        setSelectedUsers([]);
        setShowActivationModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Bulk activation error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to activate users',
        type: 'error',
      });
    }
  };

  // Handle quota inline editing
  const handleQuotaDoubleClick = (userId: number, currentQuota: number) => {
    setEditingQuotaUserId(userId);
    setEditingQuotaValue(currentQuota);
  };

  const handleQuotaSave = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyQuota: editingQuotaValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quota');
      }

      setToast({
        message: 'Quota updated successfully',
        type: 'success',
      });

      setEditingQuotaUserId(null);
      onRefresh();
    } catch (err) {
      console.error('Update quota error:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update quota',
        type: 'error',
      });
    }
  };

  const handleQuotaCancel = () => {
    setEditingQuotaUserId(null);
    setEditingQuotaValue(0);
  };

  // Handle delete functionality
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedUsers })
      });

      if (res.ok) {
        const deletedCount = selectedUsers.length;
        setSelectedUsers([]);
        setShowDeleteModal(false);
        setToast({
          message: `Successfully deleted ${deletedCount} user${deletedCount !== 1 ? 's' : ''}`,
          type: 'success',
        });
        onRefresh();
      } else {
        const errorData = await res.json();
        setShowDeleteModal(false);
        setToast({
          message: errorData.error || 'Failed to delete users',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      setShowDeleteModal(false);
      setToast({
        message: 'Error deleting users. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      header: 'User',
      className: 'flex-[2] min-w-[240px]',
      accessor: (user: UserData) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF5500] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold text-[#1c1c1c]">{user.email}</div>
            <div className="flex items-center gap-2">
               {user.role === USER_ROLES.ADMIN && (
                 <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                   <Shield className="w-3 h-3" /> Admin
                 </span>
               )}
               {user.name && <span className="text-xs text-gray-500">{user.name}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Plan',
      className: 'w-28 flex-none',
      accessor: (user: UserData) => (
        <span
          className={`px-3 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-full ${
            user.subscriptionPlan === SUBSCRIPTION_PLANS.UNLIMITED
              ? 'bg-purple-100 text-purple-700'
              : user.subscriptionPlan === SUBSCRIPTION_PLANS.BUSINESS
              ? 'bg-blue-100 text-blue-700'
              : user.subscriptionPlan === SUBSCRIPTION_PLANS.PRO
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {user.subscriptionPlan}
        </span>
      ),
    },
    {
      header: 'Quota',
      className: 'flex-1 min-w-[140px]',
      accessor: (user: UserData) => {
        const isEditing = editingQuotaUserId === user.id;

        return isEditing ? (
          <input
            type="number"
            value={editingQuotaValue}
            onChange={(e) => setEditingQuotaValue(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuotaSave(user.id);
              if (e.key === 'Escape') handleQuotaCancel();
            }}
            onBlur={() => handleQuotaCancel()}
            autoFocus
            className="w-28 px-3 py-1 border-2 border-[#FF5500] rounded-lg text-sm font-semibold focus:outline-none"
          />
        ) : (
          <div
            onDoubleClick={() => handleQuotaDoubleClick(user.id, user.monthlyQuota)}
            className="flex items-center gap-2 text-sm text-[#1c1c1c] font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
            title="Double-click to edit"
          >
            <Mail className="w-4 h-4 text-gray-400" />
            {user.monthlyQuota.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal">/mo</span>
          </div>
        );
      },
    },
    {
      header: 'Email Usage',
      className: 'flex-1 min-w-[180px]',
      accessor: (user: UserData) => {
        if (!user.quota) {
          return <span className="text-xs text-gray-400">No data</span>;
        }

        const sent = user.quota.emailsSentToday;
        const limit = user.quota.monthlyLimit;
        const percentage = limit > 0 ? Math.round((sent / limit) * 100) : 0;
        const resetDate = new Date(user.quota.lastResetDate);
        const isWarning = percentage >= 80;
        const isDanger = percentage >= 95;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1c1c1c]">
                {sent.toLocaleString()} / {limit.toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold ${
                isDanger ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-500'
              }`}>
                ({percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">
              Resets {resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Activated',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <div className="text-xs text-gray-500">
          {user.subscriptionStartedAt ? formatDate(user.subscriptionStartedAt) : (
            <span className="text-xs text-gray-400">Never</span>
          )}
        </div>
      ),
    },
    {
      header: 'Expires',
      className: 'flex-1 min-w-[120px]',
      accessor: (user: UserData) => (
        <div className="text-xs text-gray-500">
          {user.subscriptionExpiresAt ? (
            <span className={new Date(user.subscriptionExpiresAt) < new Date() ? 'text-red-600 font-semibold' : ''}>
              {formatDate(user.subscriptionExpiresAt)}
            </span>
          ) : (
            <span className="text-xs text-emerald-600 font-semibold">Active</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-32 flex-none pr-4',
      accessor: (user: UserData) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {user.active ? 'Active' : 'Inactive'}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        searchFields={(user) => `${user.email} ${user.name || ''}`}
        searchPlaceholder="Search users..."
        emptyMessage="No users found matching your search."
        emptyIcon={<Users className="w-16 h-16 text-gray-300" />}
        selectable={true}
        getItemId={(user) => user.id}
        selectedIds={selectedUsers}
        onSelectionChange={setSelectedUsers}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivationModal(true)}
              disabled={selectedUsers.length === 0}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg
                ${selectedUsers.length > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              <UserCheck className="w-4 h-4" />
              Activate ({selectedUsers.length})
            </button>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200 text-xs font-bold active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : `Delete (${selectedUsers.length})`}
              </button>
            )}
          </div>
        }
      />

      {/* Activation Modal */}
      {showActivationModal && (
        <ActivateSubscriptionModal
          userCount={selectedUsers.length}
          onClose={() => setShowActivationModal(false)}
          onConfirm={handleActivateSubscription}
          loading={activating}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="md"
        title="Delete Users"
        showCloseButton={true}
        closeOnBackdropClick={!deleting}
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                This action cannot be undone. This will permanently delete the selected user{selectedUsers.length !== 1 ? 's' : ''}.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              You are about to delete <span className="font-bold text-gray-900">{selectedUsers.length}</span> user{selectedUsers.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border border-gray-200 text-sm font-bold active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all border border-red-700 text-sm font-bold active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Users'}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
}
