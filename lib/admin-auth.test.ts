import { beforeEach, describe, expect, test } from '@jest/globals';

const MODULE_PATH = './admin-auth';

function clearAdminEnv() {
  delete process.env.ADMIN_PORTAL_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_SESSION_COOKIE_NAME;
  delete process.env.ADMIN_SESSION_TTL_HOURS;
  delete process.env.ADMIN_PORTAL_HOSTS;
}

describe('admin auth utilities', () => {
  beforeEach(() => {
    clearAdminEnv();
    jest.resetModules();
  });

  test('isAdminEnabled returns false when configuration is incomplete', async () => {
    const { isAdminEnabled } = await import(MODULE_PATH);
    expect(isAdminEnabled()).toBe(false);
  });

    test('getAdminConfig returns default config when env is missing', async () => {
    jest.resetModules();
    delete process.env.ADMIN_PORTAL_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_SESSION_COOKIE_NAME;
    delete process.env.ADMIN_SESSION_TTL_HOURS;
    const { getAdminConfig } = await import('./admin-auth');
    const config = getAdminConfig();
    expect(config.password).toBe('');
    expect(config.sessionSecret).toBe('');
    expect(config.sessionCookieName).toBe('ink-admin-session');
    expect(config.sessionTtlMs).toBeGreaterThan(0);
    });

    test('isAdminEnabled returns false for missing token', async () => {
      jest.resetModules();
      process.env.ADMIN_API_TOKEN = '';
      const { isAdminEnabled } = await import('./admin-auth');
      expect(isAdminEnabled()).toBe(false);
    });

    test('verifySessionToken returns false for malformed token', async () => {
      jest.resetModules();
      const { verifySessionToken } = await import('./admin-auth');
      expect(verifySessionToken('bad.token')).toBe(false);
      expect(verifySessionToken('')).toBe(false);
      expect(verifySessionToken(null)).toBe(false);
      expect(verifySessionToken(undefined)).toBe(false);
    });

    test('getSessionCookieOptions returns correct defaults', async () => {
    jest.resetModules();
    const { getSessionCookieOptions } = await import('./admin-auth');
    const opts = getSessionCookieOptions();
    expect(opts.options.sameSite).toBe('lax');
    expect(opts.options.httpOnly).toBe(true);
    });

    test('getSessionCookieClearOptions returns correct defaults', async () => {
    jest.resetModules();
    const { getSessionCookieClearOptions } = await import('./admin-auth');
    const opts = getSessionCookieClearOptions();
    expect(opts.options.sameSite).toBe('lax');
    expect(opts.options.httpOnly).toBe(true);
    });

  test('createSessionToken throws when configuration is incomplete', async () => {
    const { createSessionToken } = await import(MODULE_PATH);
    expect(() => createSessionToken()).toThrow('Admin portal is not fully configured.');
  });

  test('create and verify session token lifecycle', async () => {
    process.env.ADMIN_PORTAL_PASSWORD = 'pass123';
    process.env.ADMIN_SESSION_SECRET = 'session-secret';
    process.env.ADMIN_SESSION_COOKIE_NAME = 'custom-cookie';
    process.env.ADMIN_SESSION_TTL_HOURS = '2';

    const { createSessionToken, verifySessionToken, getSessionCookieOptions } = await import(MODULE_PATH);

    const issuedAt = 1_700_000_000_000;
    const token = createSessionToken(issuedAt);

    expect(verifySessionToken(token, issuedAt)).toBe(true);

    const cookie = getSessionCookieOptions();
    expect(cookie.name).toBe('custom-cookie');
    expect(cookie.options.maxAge).toBe(7200);
    expect(cookie.options.httpOnly).toBe(true);
  });

  test('verifySessionToken respects configured TTL', async () => {
    process.env.ADMIN_PORTAL_PASSWORD = 'password';
    process.env.ADMIN_SESSION_SECRET = 'another-secret';
    process.env.ADMIN_SESSION_TTL_HOURS = '1';

    const { createSessionToken, verifySessionToken, getAdminConfig } = await import(MODULE_PATH);

    const issuedAt = 1_700_000_100_000;
    const token = createSessionToken(issuedAt);
    const { sessionTtlMs } = getAdminConfig();

    expect(verifySessionToken(token, issuedAt + sessionTtlMs - 1)).toBe(true);
    expect(verifySessionToken(token, issuedAt + sessionTtlMs + 1)).toBe(false);
  });

  test('verifySessionToken handles malformed tokens and cookie clearing', async () => {
    process.env.ADMIN_PORTAL_PASSWORD = 'pass';
    process.env.ADMIN_SESSION_SECRET = 'secret';
    process.env.ADMIN_SESSION_COOKIE_NAME = 'session-cookie';
    process.env.ADMIN_SESSION_TTL_HOURS = '3';

    const {
      createSessionToken,
      verifySessionToken,
      getSessionCookieClearOptions,
    } = await import(MODULE_PATH);

    const issuedAt = 1_700_000_300_000;
    const validToken = createSessionToken(issuedAt);

    expect(verifySessionToken(null, issuedAt)).toBe(false);
    expect(verifySessionToken('not.a.valid.token', issuedAt)).toBe(false);
    expect(verifySessionToken('abc.def', issuedAt)).toBe(false);
    expect(verifySessionToken('9007199254740994.invalid', issuedAt)).toBe(false);

    const tampered = `${issuedAt}.${validToken.split('.')[1]}extra`;
    expect(verifySessionToken(tampered, issuedAt)).toBe(false);
    expect(verifySessionToken(validToken, issuedAt - 10)).toBe(false);

    const cleared = getSessionCookieClearOptions();
    expect(cleared.name).toBe('session-cookie');
    expect(cleared.options.maxAge).toBe(0);
    expect(cleared.options.httpOnly).toBe(true);
  });
});
