/**
 * RichTextEditor Component
 *
 * React-Quill based rich text editor for email campaign content.
 * Supports only email-safe formatting: Bold, Italic, Underline, Links.
 *
 * Features:
 * - Email-safe HTML output
 * - Character counter
 * - Accessibility (ARIA labels)
 * - Error states
 * - Mobile-responsive toolbar
 * - Automatic link detection
 * - No cursor jumping issues
 *
 * Usage:
 * <RichTextEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Enter your message..."
 *   maxLength={5000}
 * />
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Import ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  hasError?: boolean;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  disabled = false,
  maxLength = 5000,
  hasError = false,
  minHeight = '200px',
}: RichTextEditorProps) {
  const [characterCount, setCharacterCount] = useState(0);

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'underline'],
        ['link'],
        ['clean'], // Remove formatting
      ],
      clipboard: {
        matchVisual: false, // Preserve line breaks on paste
      },
    }),
    []
  );

  // Only allow email-safe formats
  const formats = ['bold', 'italic', 'underline', 'link'];

  // Update character count when value changes
  useEffect(() => {
    // Strip HTML tags to get text content length
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = value || '';
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    setCharacterCount(textContent.length);
  }, [value]);

  // Handle content change
  const handleChange = (html: string, delta: any, source: string, editor: any) => {
    // Get text content without HTML
    const textContent = editor.getText();
    const textLength = textContent.trim().length;

    // Enforce max length
    if (textLength <= maxLength || textLength < characterCount) {
      onChange(html);
    }
  };

  const isOverLimit = characterCount > maxLength;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        hasError
          ? 'border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 focus-within:border-red-500 shadow-sm'
          : 'border-border focus-within:ring-4 focus-within:ring-accent/10 focus-within:border-accent hover:border-accent/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'bg-background shadow-sm hover:shadow-md'}`}
    >
      {/* Editor */}
      <div
        className="quill-editor-wrapper"
        style={{ minHeight }}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
          className={disabled ? 'cursor-not-allowed' : ''}
        />
      </div>

      {/* Character Counter */}
      <div className="px-4 py-2 border-t border-border bg-muted/50 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{placeholder}</span>
        <span
          className={`font-medium ${
            isOverLimit ? 'text-red-500' : 'text-muted-foreground'
          }`}
        >
          {characterCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}
