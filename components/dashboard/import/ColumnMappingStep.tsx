'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react';

interface DetectedColumn {
  originalName: string;
  suggestedField: 'email' | 'name' | 'subscribed' | null;
  sampleValues: string[];
  confidence: number;
}

interface ImportPreview {
  filename: string;
  fileType: 'csv' | 'json';
  totalRows: number;
  detectedColumns: DetectedColumn[];
  sampleRows: any[];
  rawData: any[];
}

interface ColumnMappingData {
  emailColumn: string;
  nameColumn: string | null;
  subscribedColumn: string | null;
  metadataColumns: string[];
}

interface Props {
  preview: ImportPreview;
  onComplete: (mapping: ColumnMappingData) => void;
  onBack: () => void;
}

export default function ColumnMappingStep({ preview, onComplete, onBack }: Props) {
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [nameColumn, setNameColumn] = useState<string | null>(null);
  const [subscribedColumn, setSubscribedColumn] = useState<string | null>(null);
  const [metadataColumns, setMetadataColumns] = useState<string[]>([]);

  // Auto-select detected columns on mount
  useEffect(() => {
    const emailCol = preview.detectedColumns.find(col => col.suggestedField === 'email');
    const nameCol = preview.detectedColumns.find(col => col.suggestedField === 'name');
    const subscribedCol = preview.detectedColumns.find(col => col.suggestedField === 'subscribed');

    if (emailCol) setEmailColumn(emailCol.originalName);
    if (nameCol) setNameColumn(nameCol.originalName);
    if (subscribedCol) setSubscribedColumn(subscribedCol.originalName);

    // Auto-add unmapped columns to metadata
    const unmappedCols = preview.detectedColumns
      .filter(col => col.suggestedField === null)
      .map(col => col.originalName);
    setMetadataColumns(unmappedCols);
  }, [preview]);

  const handleNext = () => {
    if (!emailColumn) return;

    onComplete({
      emailColumn,
      nameColumn,
      subscribedColumn,
      metadataColumns
    });
  };

  const toggleMetadataColumn = (columnName: string) => {
    setMetadataColumns(prev =>
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const getMappedColumns = (): string[] => {
    return [emailColumn, nameColumn, subscribedColumn].filter(Boolean) as string[];
  };

  const getUnmappedColumns = (): DetectedColumn[] => {
    const mapped = getMappedColumns();
    return preview.detectedColumns.filter(col => !mapped.includes(col.originalName));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">High</span>;
    }
    if (confidence >= 60) {
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700">Medium</span>;
    }
    return null;
  };

  const getColumnInfo = (columnName: string): DetectedColumn | undefined => {
    return preview.detectedColumns.find(col => col.originalName === columnName);
  };

  const isNextDisabled = !emailColumn;

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{preview.filename}</span>
          <span className="text-gray-500"> · {preview.totalRows} rows · {preview.detectedColumns.length} columns</span>
        </p>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Required Fields</h3>

        {/* Email Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Column <span className="text-red-500">*</span>
          </label>
          <select
            value={emailColumn}
            onChange={(e) => setEmailColumn(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#FF5500] focus:border-transparent"
          >
            <option value="">Select column...</option>
            {preview.detectedColumns.map(col => (
              <option key={col.originalName} value={col.originalName}>
                {col.originalName}
                {col.suggestedField === 'email' && ' (Auto-detected)'}
              </option>
            ))}
          </select>
          {emailColumn && getColumnInfo(emailColumn) && (
            <div className="mt-2 flex items-center gap-2">
              {getConfidenceBadge(getColumnInfo(emailColumn)!.confidence)}
              <p className="text-xs text-gray-500">
                Sample: {getColumnInfo(emailColumn)!.sampleValues.slice(0, 2).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Optional Fields</h3>

        {/* Name Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name Column
          </label>
          <select
            value={nameColumn || ''}
            onChange={(e) => setNameColumn(e.target.value || null)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#FF5500] focus:border-transparent"
          >
            <option value="">Skip (no name)</option>
            {preview.detectedColumns.map(col => (
              <option key={col.originalName} value={col.originalName}>
                {col.originalName}
                {col.suggestedField === 'name' && ' (Auto-detected)'}
              </option>
            ))}
          </select>
          {nameColumn && getColumnInfo(nameColumn) && (
            <div className="mt-2 flex items-center gap-2">
              {getConfidenceBadge(getColumnInfo(nameColumn)!.confidence)}
              <p className="text-xs text-gray-500">
                Sample: {getColumnInfo(nameColumn)!.sampleValues.slice(0, 2).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Subscribed Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscribed Status Column
          </label>
          <select
            value={subscribedColumn || ''}
            onChange={(e) => setSubscribedColumn(e.target.value || null)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#FF5500] focus:border-transparent"
          >
            <option value="">Skip (all will default to subscribed)</option>
            {preview.detectedColumns.map(col => (
              <option key={col.originalName} value={col.originalName}>
                {col.originalName}
                {col.suggestedField === 'subscribed' && ' (Auto-detected)'}
              </option>
            ))}
          </select>
          {subscribedColumn && getColumnInfo(subscribedColumn) && (
            <div className="mt-2 flex items-center gap-2">
              {getConfidenceBadge(getColumnInfo(subscribedColumn)!.confidence)}
              <p className="text-xs text-gray-500">
                Sample: {getColumnInfo(subscribedColumn)!.sampleValues.slice(0, 2).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unmapped Columns */}
      {getUnmappedColumns().length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            Other Columns ({getUnmappedColumns().length})
          </h3>
          <p className="text-sm text-gray-600">
            Select columns to include as metadata (custom fields)
          </p>

          <div className="grid grid-cols-1 gap-3">
            {getUnmappedColumns().map(col => (
              <button
                key={col.originalName}
                onClick={() => toggleMetadataColumn(col.originalName)}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all active:scale-95
                  ${metadataColumns.includes(col.originalName)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{col.originalName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {col.sampleValues.slice(0, 3).join(', ')}
                    </p>
                  </div>
                  {metadataColumns.includes(col.originalName) && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning if no email selected */}
      {!emailColumn && (
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-900">
              Please select an email column to continue. This field is required for importing contacts.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-gray-700 font-medium active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`
            flex-1 px-6 py-3 rounded-xl font-medium transition-all active:scale-95
            ${isNextDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF5500] text-white hover:bg-[#FF5500]/90'
            }
          `}
        >
          Next: Preview Import
        </button>
      </div>
    </div>
  );
}
