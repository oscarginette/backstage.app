/**
 * Sender Email Settings Page (Server Component)
 *
 * Allows users to configure custom sender email for newsletters.
 * Validates that the domain is verified before allowing configuration.
 *
 * Clean Architecture: Uses Use Cases for business logic.
 * Security: Requires authentication, redirects to login if unauthorized.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SenderEmailSettings from './SenderEmailSettings';
import { UseCaseFactory } from '@/lib/di-container';
import { PATHS } from '@/lib/paths';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sender Email Settings | The Backstage',
  description: 'Configure your custom sender email for newsletters',
};

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

export default async function SenderEmailPage() {
  console.log('[SenderEmailPage] START - Loading sender email page');

  try {
    // Authentication check
    console.log('[SenderEmailPage] Checking authentication...');
    const session = await auth();

    console.log('[SenderEmailPage] Auth result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      console.log('[SenderEmailPage] No session, redirecting to login');
      redirect(PATHS.LOGIN);
    }

    const userId = parseInt(session.user.id);
    console.log('[SenderEmailPage] User ID parsed:', userId);

    // Fetch user settings using Use Case
    console.log('[SenderEmailPage] Creating GetUserSettingsUseCase...');
    const getUserSettingsUseCase = UseCaseFactory.createGetUserSettingsUseCase();
    const user = await getUserSettingsUseCase.execute(userId);

    if (!user) {
      console.log('[SenderEmailPage] User not found, redirecting to login');
      redirect(PATHS.LOGIN);
    }

    console.log('[SenderEmailPage] User loaded:', {
      userId: user.userId,
      hasSenderEmail: !!user.senderEmail,
      hasSenderName: !!user.senderName,
    });

    // Fetch verified domains using Use Case
    console.log('[SenderEmailPage] Creating GetUserSendingDomainsUseCase...');
    const getDomainsUseCase = UseCaseFactory.createGetUserSendingDomainsUseCase();
    const domains = await getDomainsUseCase.execute(userId);

    // Filter verified domains (business logic in component is acceptable for simple filtering)
    const verifiedDomainsList = domains
      .filter(d => d.status === 'verified')
      .map(d => d.domain);

    console.log('[SenderEmailPage] Verified domains loaded:', {
      totalDomains: domains.length,
      verifiedCount: verifiedDomainsList.length,
      domains: verifiedDomainsList,
    });

    return (
      <SenderEmailSettings
        currentSenderEmail={user.senderEmail || null}
        currentSenderName={user.senderName || null}
        verifiedDomains={verifiedDomainsList}
      />
    );
  } catch (error) {
    console.error('[SenderEmailPage] FATAL ERROR:', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error; // Let error boundary handle it
  }
}
