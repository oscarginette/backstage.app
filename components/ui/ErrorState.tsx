'use client';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  centered?: boolean;
  className?: string;
}

/**
 * ErrorState
 *
 * Reusable error display with optional retry button.
 * Shows error icon, title, message, and retry action.
 *
 * @example
 * <ErrorState
 *   title="Failed to load"
 *   message={error}
 *   onRetry={fetchData}
 *   centered
 * />
 */
export default function ErrorState({
  title = 'Error',
  message,
  onRetry,
  retryLabel = 'Try Again',
  centered = false,
  className = '',
}: ErrorStateProps) {
  const content = (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Error Icon */}
      <div className="w-16 h-16 mb-4 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600 dark:text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-sm font-serif text-foreground mb-1">{title}</h3>

      {/* Message */}
      <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-card transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {content}
      </div>
    );
  }

  return content;
}
