/**
 * QuotaGuard Component
 *
 * Protects routes by checking if user has access based on quota and subscription status.
 * Redirects to /upgrade if access is denied.
 *
 * Usage:
 * ```tsx
 * <QuotaGuard>
 *   <YourProtectedContent />
 * </QuotaGuard>
 * ```
 *
 * Clean Architecture: Presentation component for access control.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotaAccess } from '@/hooks/useQuotaAccess';
import { PATHS } from '@/lib/paths';

interface QuotaGuardProps {
  children: React.ReactNode;
  /**
   * If true, only blocks when subscription is expired.
   * If false (default), also blocks when quota limits are reached.
   */
  checkOnlyExpiry?: boolean;
}

export default function QuotaGuard({ children, checkOnlyExpiry = false }: QuotaGuardProps) {
  const router = useRouter();
  const { loading, hasAccess, isExpired, isContactLimitReached, isEmailLimitReached } =
    useQuotaAccess();

  useEffect(() => {
    if (loading) return;

    // Always block if subscription expired
    if (isExpired) {
      router.push(PATHS.UPGRADE);
      return;
    }

    // If not checking only expiry, also block when quota limits are reached
    if (!checkOnlyExpiry && (isContactLimitReached || isEmailLimitReached)) {
      router.push(PATHS.UPGRADE);
      return;
    }
  }, [loading, hasAccess, isExpired, isContactLimitReached, isEmailLimitReached, checkOnlyExpiry, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#FF5500] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Show blocked state (briefly before redirect)
  if (isExpired || (!checkOnlyExpiry && (isContactLimitReached || isEmailLimitReached))) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            {isExpired
              ? 'Tu suscripción ha caducado. Por favor, renueva tu plan para continuar.'
              : 'Has alcanzado el límite de tu plan. Por favor, actualiza tu plan para continuar.'}
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a la página de upgrade...</p>
        </div>
      </div>
    );
  }

  // User has access, show protected content
  return <>{children}</>;
}
