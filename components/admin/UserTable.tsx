/**
 * UserTable Component
 *
 * Admin component to display and manage users.
 * Provides quota editing and active status toggling.
 *
 * Clean Code: Client component with clear separation of concerns.
 */

'use client';

import { useState } from 'react';

interface UserQuota {
  emailsSentToday: number;
  monthlyLimit: number;
  remaining: number;
  lastResetDate: string;
}

interface UserData {
  id: number;
  email: string;
  role: 'user' | 'admin';
  active: boolean;
  createdAt: string;
  quota: UserQuota | null;
}

interface UserTableProps {
  users: UserData[];
  onRefresh: () => void;
}

export default function UserTable({ users, onRefresh }: UserTableProps) {
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newQuota, setNewQuota] = useState<string>('');
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEditQuota = (user: UserData) => {
    setEditingUserId(user.id);
    setNewQuota(user.quota?.monthlyLimit.toString() || '50');
    setError(null);
  };

  const handleSaveQuota = async (userId: number) => {
    try {
      setLoading(userId);
      setError(null);

      const monthlyLimit = parseInt(newQuota, 10);

      if (isNaN(monthlyLimit) || monthlyLimit <= 0 || monthlyLimit > 10000) {
        throw new Error('Quota must be between 1 and 10,000');
      }

      const response = await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quota');
      }

      setEditingUserId(null);
      onRefresh();
    } catch (err) {
      console.error('Save quota error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quota');
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    const confirmed = confirm(
      `Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this user?`
    );

    if (!confirmed) return;

    try {
      setLoading(userId);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle user status');
      }

      onRefresh();
    } catch (err) {
      console.error('Toggle active error:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewQuota('');
    setError(null);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quota Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quota Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={!user.active ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {user.id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.quota ? user.quota.emailsSentToday : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newQuota}
                        onChange={(e) => setNewQuota(e.target.value)}
                        min="1"
                        max="10000"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={loading === user.id}
                      />
                      <button
                        onClick={() => handleSaveQuota(user.id)}
                        disabled={loading === user.id}
                        className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                      >
                        {loading === user.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading === user.id}
                        className="text-gray-600 hover:text-gray-800 text-xs font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span>{user.quota?.monthlyLimit || '-'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {editingUserId !== user.id && (
                    <>
                      <button
                        onClick={() => handleEditQuota(user)}
                        disabled={loading === user.id}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        Edit Quota
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={loading === user.id}
                        className={`${
                          user.active
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        } disabled:opacity-50`}
                      >
                        {loading === user.id
                          ? 'Processing...'
                          : user.active
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}
