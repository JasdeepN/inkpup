import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_COOKIE_NAME = 'ink-admin-session';
const DEFAULT_SESSION_TTL_HOURS = 8;

export interface AdminPortalConfig {
  slug: string;
  password: string;
  sessionSecret: string;
  sessionCookieName: string;
  sessionTtlMs: number;
}

function toBase64UrlDigest(payload: string, secret: string): string {
  const digest = createHmac('sha256', secret).update(payload).digest('base64');
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function parseTtlMs(raw?: string): number {
  const parsed = Number(raw);
  const hours = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TTL_HOURS;
  return Math.round(hours * 60 * 60 * 1000);
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getAdminConfig(): AdminPortalConfig {
  const slug = readEnv('ADMIN_PORTAL_SLUG') ?? '';
  const password = readEnv('ADMIN_PORTAL_PASSWORD') ?? '';
  const sessionSecret = readEnv('ADMIN_SESSION_SECRET') ?? '';
  const sessionCookieName = readEnv('ADMIN_SESSION_COOKIE_NAME') ?? DEFAULT_COOKIE_NAME;
  const sessionTtlMs = parseTtlMs(readEnv('ADMIN_SESSION_TTL_HOURS'));

  return {
    slug,
    password,
    sessionSecret,
    sessionCookieName,
    sessionTtlMs,
  };
}

export function isAdminEnabled(): boolean {
  const config = getAdminConfig();
  return Boolean(config.slug && config.password && config.sessionSecret);
}

function buildSignaturePayload(issuedAt: number, password: string): string {
  return `${issuedAt}.${password}`;
}

export function createSessionToken(issuedAt = Date.now()): string {
  const config = getAdminConfig();
  if (!isAdminEnabled()) {
    throw new Error('Admin portal is not fully configured.');
  }

  const payload = buildSignaturePayload(issuedAt, config.password);
  const signature = toBase64UrlDigest(payload, config.sessionSecret);
  return `${issuedAt}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) return false;
  if (!isAdminEnabled()) return false;

  const config = getAdminConfig();
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [issuedAtRaw, providedSignature] = parts;
  if (!/^[0-9]+$/u.test(issuedAtRaw)) return false;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isSafeInteger(issuedAt)) return false;

  const expectedSignature = toBase64UrlDigest(buildSignaturePayload(issuedAt, config.password), config.sessionSecret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  try {
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
      return false;
    }
  } catch {
    return false;
  }

  const age = now - issuedAt;
  return age >= 0 && age <= config.sessionTtlMs;
}

export function getSessionCookieOptions() {
  const config = getAdminConfig();
  return {
    name: config.sessionCookieName,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: Math.floor(config.sessionTtlMs / 1000),
      path: '/',
    },
  };
}

export function getSessionCookieClearOptions() {
  const { name } = getSessionCookieOptions();
  return {
    name,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    },
  };
}

export function isValidAdminSlug(candidate: string | undefined | null): boolean {
  const config = getAdminConfig();
  if (!config.slug) return false;
  if (!candidate) return false;
  return candidate === config.slug;
}
