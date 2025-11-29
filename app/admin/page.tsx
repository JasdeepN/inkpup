import { isAdminHost } from '../../lib/admin-hosts';
import { verifySessionToken, getSessionCookieOptions, isAdminEnabled } from '../../lib/admin-auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '../../components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try {
    console.log('[AdminPage] Starting...');
    
    // Check if admin is enabled
    const adminEnabled = isAdminEnabled();
    console.log('[AdminPage] isAdminEnabled:', adminEnabled);
    
    if (!adminEnabled) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Admin Not Configured</h2>
            <p className="text-gray-700">
              The admin portal requires ADMIN_PORTAL_PASSWORD and ADMIN_SESSION_SECRET environment variables.
            </p>
          </div>
        </div>
      );
    }
    
    // Check if we're on an admin host
    const headersList = await headers();
    const host = headersList.get('host');
    console.log('[AdminPage] Host:', host);
    
    if (!isAdminHost(host)) {
      console.log('[AdminPage] Not admin host, redirecting to /');
      redirect('/');
    }

    // Check if already authenticated
    const cookieStore = await cookies();
    const { name: cookieName } = getSessionCookieOptions();
    const sessionToken = cookieStore.get(cookieName)?.value;
    console.log('[AdminPage] Cookie name:', cookieName, 'Has token:', !!sessionToken);
    
    const isAuthenticated = sessionToken ? verifySessionToken(sessionToken) : false;
    console.log('[AdminPage] isAuthenticated:', isAuthenticated);

    if (isAuthenticated) {
      console.log('[AdminPage] Already authenticated, redirecting to /dashboard');
      redirect('/dashboard');
    }

    console.log('[AdminPage] Rendering LoginForm');
    return <LoginForm />;
  } catch (error) {
    console.error('[AdminPage] ERROR:', error);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
        <div className="max-w-lg p-8 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Page Error</h2>
          <p style={{ color: '#fff' }}>Error: {error instanceof Error ? error.message : 'Unknown'}</p>
          <pre style={{ fontSize: '0.65rem', overflow: 'auto', marginTop: '1rem', color: '#aaa' }}>
            {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}
