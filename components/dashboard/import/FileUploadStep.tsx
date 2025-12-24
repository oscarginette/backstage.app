'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
  onComplete: (preview: any) => void;
  onError: (error: string) => void;
}

export default function FileUploadStep({ onComplete, onError }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validExtensions = ['.csv', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      onError('Invalid file type. Please upload a CSV or JSON file.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onError('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    onError('');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to parse endpoint
      const response = await fetch('/api/contacts/import/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file');
      }

      // Pass preview to parent
      onComplete(data.preview);
    } catch (err: any) {
      onError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'border-[#FF5500] bg-[#FF5500]/5' : 'border-gray-300 hover:border-[#FF5500]/50'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm font-medium text-gray-700">Parsing file...</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-3 text-base font-bold text-[#1c1c1c]">
              Drop your file here or click to browse
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Supports CSV and JSON files up to 10MB
            </p>
          </>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-blue-900">
            <p className="font-medium">File Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>CSV must have column headers in the first row</li>
              <li>JSON must be an array of contact objects</li>
              <li>At least an email column/field is required</li>
              <li>Optional: name, subscribed status, and custom fields</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Format */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-gray-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">CSV Example</p>
          </div>
          <pre className="text-[10px] text-gray-700 font-mono leading-tight">
{`email,name,subscribed
john@example.com,John Doe,true
jane@example.com,Jane Smith,yes`}
          </pre>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-3.5 h-3.5 text-gray-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">JSON Example</p>
          </div>
          <pre className="text-[10px] text-gray-700 font-mono leading-tight">
{`[
  {
    "email": "john@example.com",
    "name": "John Doe",
    "subscribed": true
  }
]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
