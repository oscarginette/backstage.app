'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { ContactList } from '@/domain/entities/ContactList';

interface ListSelectorProps {
  selectedListIds: string[];
  onChange: (listIds: string[]) => void;
  mode: 'all' | 'include' | 'exclude';
  onModeChange: (mode: 'all' | 'include' | 'exclude') => void;
}

export default function ListSelector({
  selectedListIds,
  onChange,
  mode,
  onModeChange,
}: ListSelectorProps) {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/contact-lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      const data = await response.json();
      setLists(data.lists.map((item: any) => item.list));
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (listId: string) => {
    if (selectedListIds.includes(listId)) {
      onChange(selectedListIds.filter(id => id !== listId));
    } else {
      onChange([...selectedListIds, listId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Send To</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'all'}
              onChange={() => onModeChange('all')}
              className="w-4 h-4 text-[#FF5500] focus:ring-[#FF5500]"
            />
            <span className="text-sm">All Contacts</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'include'}
              onChange={() => onModeChange('include')}
              className="w-4 h-4 text-[#FF5500] focus:ring-[#FF5500]"
            />
            <span className="text-sm">Specific Lists</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'exclude'}
              onChange={() => onModeChange('exclude')}
              className="w-4 h-4 text-[#FF5500] focus:ring-[#FF5500]"
            />
            <span className="text-sm">Exclude Lists</span>
          </label>
        </div>
      </div>

      {mode !== 'all' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {mode === 'include' ? 'Select Lists' : 'Exclude Lists'}
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-sm text-gray-500">No lists available. Create one first.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {lists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedListIds.includes(list.id)}
                    onChange={() => handleToggle(list.id)}
                    className="w-4 h-4 text-[#FF5500] focus:ring-[#FF5500] rounded"
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="text-sm flex-1">{list.name}</span>
                  {selectedListIds.includes(list.id) && (
                    <Check className="w-4 h-4 text-[#FF5500]" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
