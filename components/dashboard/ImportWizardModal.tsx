'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FileUploadStep from './import/FileUploadStep';
import ColumnMappingStep from './import/ColumnMappingStep';
import PreviewStep from './import/PreviewStep';
import ResultsStep from './import/ResultsStep';

/**
 * ImportWizardModal
 *
 * Multi-step modal for importing contacts from CSV/JSON.
 * Manages state flow between steps and handles API communication.
 *
 * Steps:
 * 1. upload - File selection and parsing
 * 2. mapping - Column mapping verification
 * 3. preview - Data preview and confirmation
 * 4. importing - Import in progress
 * 5. results - Import results
 */

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ImportPreview {
  filename: string;
  fileType: 'csv' | 'json';
  fileSizeBytes: number;
  totalRows: number;
  detectedColumns: Array<{
    originalName: string;
    suggestedField: 'email' | 'name' | 'subscribed' | null;
    sampleValues: string[];
    confidence: number;
  }>;
  sampleRows: any[];
  rawData: any[];
}

interface ColumnMappingData {
  emailColumn: string;
  nameColumn: string | null;
  subscribedColumn: string | null;
  metadataColumns: string[];
}

interface ImportResults {
  importId: number;
  contactsInserted: number;
  contactsUpdated: number;
  contactsSkipped: number;
  duration: number;
  hasErrors: boolean;
  errors?: Array<{ email: string; error: string }>;
}

interface QuotaInfo {
  exceeded: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  message?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportWizardModal({ isOpen, onClose, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingData | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [estimatedTotalTime, setEstimatedTotalTime] = useState(0);

  // Optimistic progress simulation when importing
  useEffect(() => {
    if (currentStep !== 'importing') {
      setImportProgress(0);
      return;
    }

    // Calculate estimated time based on contact count
    // Estimate: ~100 contacts per second (conservative estimate)
    const contactCount = preview?.totalRows || 0;
    const estimatedSeconds = Math.max(3, Math.min(30, contactCount / 100));
    setEstimatedTotalTime(estimatedSeconds);

    // Progress animation: smooth increment every 100ms
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        // Slow down as we approach 90% to avoid completing before actual import
        if (prev >= 90) return Math.min(95, prev + 0.5);
        if (prev >= 70) return prev + 1;
        if (prev >= 50) return prev + 2;
        return prev + 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStep, preview?.totalRows]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state
    setCurrentStep('upload');
    setPreview(null);
    setColumnMapping(null);
    setResults(null);
    setQuotaInfo(null);
    setError(null);
    setImportProgress(0);
    setEstimatedTotalTime(0);
    onClose();
  };

  const handleUploadComplete = (uploadedPreview: ImportPreview) => {
    setPreview(uploadedPreview);
    setError(null);
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mapping: ColumnMappingData) => {
    setColumnMapping(mapping);
    setCurrentStep('preview');
  };

  const handlePreviewConfirm = async () => {
    if (!preview || !columnMapping) return;

    setCurrentStep('importing');
    setError(null);

    try {
      const response = await fetch('/api/contacts/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData: preview.rawData,
          columnMapping,
          fileMetadata: {
            filename: preview.filename,
            fileType: preview.fileType,
            fileSizeBytes: preview.fileSizeBytes,
            totalRows: preview.totalRows
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.import);
      setQuotaInfo(data.quota || null);
      // Set progress to 100% before transitioning
      setImportProgress(100);
      // Small delay to show 100% completion
      setTimeout(() => {
        setCurrentStep('results');
      }, 300);
    } catch (err: any) {
      setError(err.message);
      setImportProgress(0);
      setCurrentStep('preview'); // Go back to preview on error
    }
  };

  const handleResultsComplete = () => {
    onSuccess(); // Refresh contacts list
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      customHeader={
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E8E6DF]">
            <div>
              <h2 className="text-2xl font-bold text-[#1c1c1c]">Import Contacts</h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentStep === 'upload' && 'Upload CSV or JSON file'}
                {currentStep === 'mapping' && 'Verify column mappings'}
                {currentStep === 'preview' && 'Preview and confirm'}
                {currentStep === 'importing' && 'Importing contacts...'}
                {currentStep === 'results' && 'Import complete'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
              disabled={currentStep === 'importing'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-4 border-b border-[#E8E6DF]">
            <div className="flex items-center justify-between">
              {(['upload', 'mapping', 'preview', 'results'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === step
                        ? 'bg-[#FF5500] text-white'
                        : ['upload', 'mapping', 'preview'].indexOf(currentStep) > index ||
                          currentStep === 'importing' ||
                          currentStep === 'results'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        ['upload', 'mapping', 'preview'].indexOf(currentStep) > index ||
                        currentStep === 'importing' ||
                        currentStep === 'results'
                          ? 'bg-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      }
    >
      <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {currentStep === 'upload' && (
            <FileUploadStep onComplete={handleUploadComplete} onError={setError} />
          )}

          {currentStep === 'mapping' && preview && (
            <ColumnMappingStep
              preview={preview}
              onComplete={handleMappingComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}

          {currentStep === 'preview' && preview && columnMapping && (
            <PreviewStep
              preview={preview}
              columnMapping={columnMapping}
              onConfirm={handlePreviewConfirm}
              onBack={() => setCurrentStep('mapping')}
            />
          )}

          {currentStep === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              {/* Animated spinner */}
              <div className="w-16 h-16 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />

              {/* Status text */}
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">Importing contacts...</p>
                <p className="text-sm text-gray-500 mt-1">
                  {preview?.totalRows.toLocaleString()} contacts • {Math.round(importProgress)}% complete
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md space-y-2">
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  {/* Animated gradient background */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-[#FF5500] via-[#FF6B2C] to-[#FF5500] bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-out"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>

                {/* Time estimate */}
                <p className="text-xs text-gray-500 text-center">
                  {importProgress < 95
                    ? `Estimated time: ${Math.max(1, Math.round(estimatedTotalTime * (1 - importProgress / 100)))}s remaining`
                    : 'Finishing up...'}
                </p>
              </div>
            </div>
          )}

          {currentStep === 'results' && results && (
            <ResultsStep results={results} quotaInfo={quotaInfo} onComplete={handleResultsComplete} />
          )}
      </div>
    </Modal>
  );
}

