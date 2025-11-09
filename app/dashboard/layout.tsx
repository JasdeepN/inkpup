import { notFound, redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { isAdminEnabled, verifySessionToken, getSessionCookieOptions } from '../../lib/admin-auth';
import { isAdminHost } from '../../lib/admin-hosts';
import type { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isAdminEnabled()) {
    notFound();
  }
  
  const headerStore = await headers();
  const hostHeader = headerStore.get('host');
  
  if (!hostHeader || !isAdminHost(hostHeader)) {
    notFound();
  }
  
  const cookieStore = await cookies();
  const { name: sessionCookieName } = getSessionCookieOptions();
  const sessionToken = cookieStore.get(sessionCookieName)?.value ?? null;
  const authenticated = verifySessionToken(sessionToken);
  
  if (!authenticated) {
    redirect('/admin');
  }
  
  return <>{children}</>;
}
