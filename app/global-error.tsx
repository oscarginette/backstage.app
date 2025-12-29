'use client';

/**
 * Global Error Boundary (Root Layout)
 *
 * Catches errors that occur in the root layout.
 * This is a fallback for errors that can't be caught by app/error.tsx
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md text-center">
            <h1 className="text-6xl font-bold text-gray-900">500</h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-700">
              Application Error
            </h2>
            <p className="mt-2 text-gray-600">
              A critical error occurred. We've been notified.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={reset}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-300"
              >
                Go to home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
