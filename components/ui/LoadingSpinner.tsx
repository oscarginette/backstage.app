'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  centered?: boolean;
  className?: string;
}

/**
 * LoadingSpinner
 *
 * Reusable loading indicator with optional message.
 * Used across the app for loading states.
 *
 * @example
 * <LoadingSpinner size="lg" message="Loading..." centered />
 */
export default function LoadingSpinner({
  size = 'md',
  message,
  centered = false,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-4 border-border border-t-accent animate-spin`}
        role="status"
        aria-label={message || 'Loading'}
      >
        <span className="sr-only">{message || 'Loading...'}</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}
