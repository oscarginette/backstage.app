'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortKey?: (item: T) => string | number | Date; // Function to extract sortable value
  sortable?: boolean; // Enable/disable sorting for this column
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  actions?: React.ReactNode;
  rowClickable?: boolean;
  onRowClick?: (item: T) => void;
  // Multiselect props
  selectable?: boolean;
  getItemId?: (item: T) => number;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

export default function DataTable<T>({
  data,
  columns,
  loading,
  searchPlaceholder = 'Search...',
  searchFields,
  emptyMessage = 'No data found.',
  emptyIcon,
  actions,
  rowClickable,
  onRowClick,
  selectable = false,
  getItemId,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleSort = (columnIndex: number) => {
    const column = columns[columnIndex];

    // Only sort if column has sortKey or sortable is explicitly true
    if (!column.sortKey && column.sortable !== true) return;

    if (sortColumnIndex === columnIndex) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumnIndex(null);
      }
    } else {
      setSortColumnIndex(columnIndex);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data];

    // Step 1: Sort ALL data (if sorting is active)
    if (sortColumnIndex !== null && sortDirection) {
      const column = columns[sortColumnIndex];
      if (column.sortKey) {
        result.sort((a, b) => {
          const aValue = column.sortKey!(a);
          const bValue = column.sortKey!(b);

          // Handle different types
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortDirection === 'asc'
              ? aValue.getTime() - bValue.getTime()
              : bValue.getTime() - aValue.getTime();
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          }

          // String comparison
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();

          if (sortDirection === 'asc') {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        });
      }
    }

    // Step 2: Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => searchFields(item).toLowerCase().includes(query));
    }

    return result;
  }, [data, searchQuery, searchFields, sortColumnIndex, sortDirection, columns]);

  const handleSelectAll = () => {
    if (!selectable || !getItemId || !onSelectionChange) return;

    if (selectedIds.length === sortedAndFilteredData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedAndFilteredData.map(getItemId));
    }
  };

  const handleSelectOne = (id: number) => {
    if (!selectable || !onSelectionChange) return;

    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const rowVirtualizer = useVirtualizer({
    count: sortedAndFilteredData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport
  });

  if (loading) {
    return (
      <div className="w-full bg-white/40 backdrop-blur-xl rounded-3xl border border-[#E8E6DF]/50 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FF5500] animate-spin" />
        <span className="text-sm font-medium text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[#E8E6DF]/50 overflow-hidden shadow-2xl shadow-black/[0.02] flex flex-col">
      {/* Table Header / Toolbar */}
      <div className="p-6 md:p-8 border-b border-[#E8E6DF]/40 space-y-6 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-5 py-3 pl-12 rounded-2xl border border-[#E8E6DF]/60 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/10 focus:border-[#FF5500]/40 transition-all text-sm outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {actions}
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#E8E6DF]/60 bg-white/60 text-gray-500 hover:text-[#1c1c1c] hover:bg-white transition-all text-sm font-bold active:scale-95">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Total count */}
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {sortedAndFilteredData.length} {sortedAndFilteredData.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Table Header Row - Fixed */}
      {sortedAndFilteredData.length > 0 && (
        <div className="border-b border-[#E8E6DF]/40 flex bg-gray-50/50">
          {selectable && (
            <div className="px-6 py-5 flex-shrink-0" style={{ width: '60px' }}>
              <input
                type="checkbox"
                checked={sortedAndFilteredData.length > 0 && selectedIds.length === sortedAndFilteredData.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
              />
            </div>
          )}
          {columns.map((col, i) => {
            const isSortable = col.sortKey || col.sortable;
            const isSorted = sortColumnIndex === i;

            return (
              <div
                key={i}
                onClick={() => isSortable && handleSort(i)}
                className={`
                  px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]
                  ${col.className?.includes('flex-') || col.className?.includes('w-') ? '' : 'flex-1'}
                  ${col.className || ''}
                  ${isSortable ? 'cursor-pointer hover:text-[#FF5500] transition-colors select-none' : ''}
                  ${isSorted ? 'text-[#FF5500]' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {isSortable && (
                    <span className="flex-shrink-0">
                      {!isSorted && <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
                      {isSorted && sortDirection === 'asc' && <ArrowUp className="w-3.5 h-3.5" />}
                      {isSorted && sortDirection === 'desc' && <ArrowDown className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Virtual Scrolling Table Container */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto bg-white/40"
        style={{ minHeight: '600px', maxHeight: 'calc(100vh - 300px)' }}
      >
        {sortedAndFilteredData.length === 0 ? (
          <div className="px-8 py-24 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="text-gray-200">
                {emptyIcon || <Search className="w-16 h-16" />}
              </div>
              <p className="text-lg font-serif text-[#1c1c1c]">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = sortedAndFilteredData[virtualRow.index];
              const itemId = selectable && getItemId ? getItemId(item) : -1;
              const isSelected = selectable && selectedIds.includes(itemId);

              return (
                <div
                  key={virtualRow.index}
                  onClick={(e) => {
                    // If selectable, toggle selection when clicking anywhere on the row except buttons
                    if (selectable && getItemId) {
                      const target = e.target as HTMLElement;
                      // Don't toggle if clicking on a button, link, or input
                      if (!target.closest('button, a, input')) {
                        handleSelectOne(itemId);
                      }
                    }
                    // Also call custom onRowClick if provided
                    onRowClick?.(item);
                  }}
                  className={`
                    group transition-colors duration-300 absolute w-full flex border-b border-[#E8E6DF]/30
                    hover:bg-[#F5F3ED]/40
                    ${rowClickable || selectable ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-[#FF5500]/5' : ''}
                  `}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {selectable && (
                    <div className="px-6 py-5 flex-shrink-0 flex items-center" style={{ width: '60px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(itemId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-[#FF5500] focus:ring-[#FF5500] cursor-pointer"
                      />
                    </div>
                  )}
                  {columns.map((col, j) => (
                    <div key={j} className={`px-8 py-5 ${col.className?.includes('flex-') || col.className?.includes('w-') ? '' : 'flex-1'} ${col.className || ''}`}>
                      {col.accessor(item)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
