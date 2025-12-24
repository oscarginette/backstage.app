'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
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
  itemsPerPage?: number;
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
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => searchFields(item).toLowerCase().includes(query));
  }, [data, searchQuery, searchFields]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="w-full bg-white/40 backdrop-blur-xl rounded-3xl border border-[#E8E6DF]/50 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FF5500] animate-spin" />
        <span className="text-sm font-medium text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-[#E8E6DF]/50 overflow-hidden shadow-2xl shadow-black/[0.02]">
      {/* Table Header / Toolbar */}
      <div className="p-6 md:p-8 border-b border-[#E8E6DF]/40 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-[#E8E6DF]/40">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ${col.className}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E6DF]/30">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-gray-200">
                      {emptyIcon || <Search className="w-16 h-16" />}
                    </div>
                    <p className="text-lg font-serif text-[#1c1c1c]">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((item, i) => (
                <tr 
                  key={i}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    group transition-colors duration-300
                    hover:bg-[#F5F3ED]/40 
                    ${rowClickable ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map((col, j) => (
                    <td key={j} className={`px-8 py-5 ${col.className}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 md:p-8 border-t border-[#E8E6DF]/40 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#E8E6DF]/60 bg-white/60 text-gray-400 hover:text-[#1c1c1c] disabled:opacity-30 disabled:hover:text-gray-400 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`
                    w-10 h-10 rounded-xl text-xs font-bold transition-all active:scale-95
                    ${currentPage === i + 1 
                      ? 'bg-[#1c1c1c] text-white shadow-lg' 
                      : 'text-gray-400 hover:text-[#1c1c1c] hover:bg-white'}
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#E8E6DF]/60 bg-white/60 text-gray-400 hover:text-[#1c1c1c] disabled:opacity-30 disabled:hover:text-gray-400 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
