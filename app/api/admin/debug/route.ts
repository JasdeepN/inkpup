import { NextResponse } from 'next/server';
import { isAdminEnabled, getAdminConfig } from '../../../../lib/admin-auth';

export async function GET() {
  const config = getAdminConfig();
  
  return NextResponse.json({
    isAdminEnabled: isAdminEnabled(),
    hasPassword: !!config.password,
    hasSessionSecret: !!config.sessionSecret,
    passwordLength: config.password?.length ?? 0,
    secretLength: config.sessionSecret?.length ?? 0,
    cookieName: config.sessionCookieName,
    sessionTtlMs: config.sessionTtlMs,
  });
}
