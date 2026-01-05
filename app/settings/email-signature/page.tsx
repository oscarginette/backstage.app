import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PATHS } from '@/lib/paths';
import EmailSignatureClient from './EmailSignatureClient';

export default async function EmailSignaturePage() {
  const session = await auth();

  if (!session?.user) {
    redirect(PATHS.LOGIN);
  }

  return <EmailSignatureClient userId={parseInt(session.user.id)} />;
}
