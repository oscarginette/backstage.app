'use client';

/**
 * Global Error Boundary
 *
 * Catches all unhandled errors in the application.
 * Automatically reports errors to Sentry for monitoring.
 * Provides user-friendly error UI with recovery options.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">Oops!</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-700">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-600">
            We've been notified and are looking into it.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
            <h3 className="font-semibold text-red-800">Error Details (Dev Only)</h3>
            <pre className="mt-2 overflow-x-auto text-xs text-red-700">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Go to home
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
