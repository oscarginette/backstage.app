'use client';

import { useState } from 'react';
import { Mail, Shield, Calendar, AlertCircle } from 'lucide-react';

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
    <div className="w-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[#E8E6DF]/50 overflow-hidden shadow-2xl shadow-black/[0.02] flex flex-col">
      {error && (
        <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FDFCF9]/50 border-b border-[#E8E6DF]/40">
            <tr>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                User Account
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Role
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Quota Usage
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Monthly Limit
              </th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DF]/30">
            {users.map((user) => (
              <tr 
                key={user.id} 
                className={`group transition-colors duration-300 hover:bg-[#F5F3ED]/40 ${!user.active ? 'opacity-60' : ''}`}
              >
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <div className="text-sm font-bold text-[#1c1c1c]">{user.email}</div>
                    <div className="text-[10px] font-mono text-gray-400">ID: {user.id}</div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100/50 text-gray-500'
                    }`}
                  >
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#1c1c1c]">
                     <Mail className="w-4 h-4 text-gray-300" />
                     {user.quota ? user.quota.emailsSentToday.toLocaleString() : '-'}
                  </div>
                </td>
                <td className="px-8 py-5">
                  {editingUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newQuota}
                        onChange={(e) => setNewQuota(e.target.value)}
                        min="1"
                        max="10000"
                        className="w-24 px-3 py-1.5 border border-[#FF5500]/30 rounded-lg text-sm font-bold text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 bg-white"
                        disabled={loading === user.id}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveQuota(user.id)}
                        disabled={loading === user.id}
                        className="p-1.5 bg-[#FF5500] text-white rounded-lg hover:bg-[#e64d00]"
                      >
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading === user.id}
                        className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-gray-500">{user.quota?.monthlyLimit.toLocaleString() || '-'}</span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  {editingUserId !== user.id && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditQuota(user)}
                        disabled={loading === user.id}
                        className="px-3 py-1.5 rounded-lg border border-[#E8E6DF] text-[10px] font-bold text-gray-500 hover:text-[#1c1c1c] hover:bg-white hover:border-[#1c1c1c]/20 transition-all uppercase tracking-wide"
                      >
                        Edit Limit
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={loading === user.id}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all uppercase tracking-wide ${
                          user.active
                            ? 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'
                            : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200'
                        }`}
                      >
                        {user.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-400">
           <p className="font-serif italic">No users found.</p>
        </div>
      )}
    </div>
  );
}
