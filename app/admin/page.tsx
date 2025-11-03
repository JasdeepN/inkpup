import { isAdminHost } from '../../lib/admin-hosts';
import { verifySessionToken, getSessionCookieOptions, isAdminEnabled } from '../../lib/admin-auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '../../components/admin/LoginForm';

export default async function AdminPage() {
  // Check if admin is enabled
  if (!isAdminEnabled()) {
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
  
  if (!isAdminHost(host)) {
    redirect('/');
  }

  // Check if already authenticated
  const cookieStore = await cookies();
  const { name: cookieName } = getSessionCookieOptions();
  const sessionToken = cookieStore.get(cookieName)?.value;
  const isAuthenticated = sessionToken ? verifySessionToken(sessionToken) : false;

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
