import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionCookieClearOptions } from '@/lib/admin-auth';
import { ADMIN_PUBLIC_BASE_PATH } from '@/lib/admin-hosts';

/**
 * POST /api/admin/logout
 * Clears the admin session cookie and redirects to the login page.
 */
export async function POST(request: NextRequest) {
  const { name, options } = getSessionCookieClearOptions();
  const store = await cookies();
  store.set(name, '', options);

  // Use forwarded headers for correct redirect URL (behind reverse proxy)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host') || 'localhost';
  const proto = forwardedProto || (request.url.startsWith('https') ? 'https' : 'http');

  const redirectUrl = new URL(`${ADMIN_PUBLIC_BASE_PATH}?status=logout`, `${proto}://${host}`);
  return NextResponse.redirect(redirectUrl, 303);
}
