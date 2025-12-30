'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  customHeader?: ReactNode;
  hideDefaultHeader?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
};

/**
 * Modal Component - Reusable modal wrapper
 *
 * Features:
 * - Click outside to close
 * - Configurable sizes
 * - Optional header with title
 * - Backdrop blur effect
 * - Prevents body scroll when open
 *
 * @example
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   size="4xl"
 *   title="Import Contacts"
 *   subtitle="Upload CSV or JSON file"
 * >
 *   <div className="p-6">Modal content here</div>
 * </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  size = '4xl',
  title,
  subtitle,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  customHeader,
  hideDefaultHeader = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Custom Header */}
        {customHeader}

        {/* Default Header (optional) */}
        {!hideDefaultHeader && !customHeader && (title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-[#E8E6DF]">
            <div>
              {title && (
                <h2 className="text-2xl font-bold text-[#1c1c1c]">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * ModalBody - Scrollable content area
 */
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ModalFooter - Fixed footer with actions
 */
export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 border-t border-[#E8E6DF] bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}
