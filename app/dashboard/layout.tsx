import { notFound, redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { isAdminEnabled, verifySessionToken, getSessionCookieOptions } from '../../lib/admin-auth';
import { isAdminHost } from '../../lib/admin-hosts';
import AdminNav from '../../components/admin/AdminNav';
import type { ReactNode } from 'react';

// Helper to check if error is a Next.js redirect/notFound (they use special digest)
function isNextNavigationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    ((error as any).digest.startsWith('NEXT_REDIRECT') ||
     (error as any).digest.startsWith('NEXT_NOT_FOUND'))
  );
}

// Force dynamic rendering - auth checks must happen at runtime
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    console.log('[AdminLayout] Starting auth check...');
    
    const adminEnabled = isAdminEnabled();
    console.log('[AdminLayout] isAdminEnabled:', adminEnabled);
    
    if (!adminEnabled) {
      console.log('[AdminLayout] Admin not enabled, returning 404');
      notFound();
    }
    
    const headerStore = await headers();
    const hostHeader = headerStore.get('host');
    console.log('[AdminLayout] Host header:', hostHeader);
    
    if (!hostHeader || !isAdminHost(hostHeader)) {
      console.log('[AdminLayout] Invalid host, returning 404');
      notFound();
    }
    
    const cookieStore = await cookies();
    const { name: sessionCookieName } = getSessionCookieOptions();
    const sessionToken = cookieStore.get(sessionCookieName)?.value ?? null;
    console.log('[AdminLayout] Session cookie name:', sessionCookieName, 'Has token:', !!sessionToken);
    
    const authenticated = verifySessionToken(sessionToken);
    console.log('[AdminLayout] Authenticated:', authenticated);
    
    if (!authenticated) {
      console.log('[AdminLayout] Not authenticated, redirecting to /admin');
      redirect('/admin');
    }
    
    console.log('[AdminLayout] Auth passed, rendering AdminNav + children');
    return (
      <>
        <AdminNav />
        {children}
      </>
    );
  } catch (error) {
    // Re-throw Next.js navigation errors (redirect, notFound) - they're not real errors
    if (isNextNavigationError(error)) {
      throw error;
    }
    console.error('[AdminLayout] ERROR:', error);
    return (
      <div className="admin-shell">
        <div className="admin-card" style={{ background: 'rgba(239,68,68,0.1)', padding: '2rem' }}>
          <h2 style={{ color: '#ef4444' }}>Layout Error</h2>
          <p>Error in AdminLayout: {error instanceof Error ? error.message : 'Unknown'}</p>
          <pre style={{ fontSize: '0.7rem', overflow: 'auto', marginTop: '1rem' }}>
            {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}
