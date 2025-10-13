import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

const MODULE_PATH = './admin-hosts';

const originalNodeEnv = process.env.NODE_ENV;

function resetEnv() {
  delete process.env.ADMIN_PORTAL_HOSTS;
}

function setNodeEnv(value: string | undefined) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
    writable: true,
  });
}

describe('admin host configuration', () => {
  beforeEach(() => {
    resetEnv();
    jest.resetModules();
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  test('provides default hosts in production', async () => {
    setNodeEnv('production');
    const { getAdminHosts, isAdminHost } = await import(MODULE_PATH);

    const hosts = getAdminHosts();
    expect(hosts).toEqual(expect.arrayContaining(['admin.inkpup.ca', 'dev.admin.inkpup.ca']));
    expect(isAdminHost('admin.inkpup.ca')).toBe(true);
    expect(isAdminHost('localhost:3000')).toBe(false);
  });

  test('merges environment overrides', async () => {
    setNodeEnv('production');
    process.env.ADMIN_PORTAL_HOSTS = 'foo.example.com, BAR.test:1234 ';

    const { getAdminHosts, isAdminHost } = await import(MODULE_PATH);

    expect(getAdminHosts()).toEqual(['foo.example.com', 'bar.test:1234']);
    expect(isAdminHost('bar.test:1234')).toBe(true);
    expect(isAdminHost('admin.inkpup.com')).toBe(false);
  });

  test('adds localhost in non-production environments', async () => {
    setNodeEnv('development');
    const { getAdminHosts, isAdminHost } = await import(MODULE_PATH);

    expect(getAdminHosts()).toEqual(expect.arrayContaining(['admin.inkpup.ca', 'dev.admin.inkpup.ca', 'localhost', '127.0.0.1']));
    expect(isAdminHost('localhost:3000')).toBe(true);
    expect(isAdminHost('127.0.0.1')).toBe(true);
  });

  test('getPrimaryAdminHost returns first host or null', async () => {
    setNodeEnv('production');
    delete process.env.ADMIN_PORTAL_HOSTS;
    const { getPrimaryAdminHost } = await import(MODULE_PATH);
    expect(getPrimaryAdminHost()).toBe('admin.inkpup.ca');

    process.env.ADMIN_PORTAL_HOSTS = '';
    expect(getPrimaryAdminHost()).toBe('admin.inkpup.ca');

    process.env.ADMIN_PORTAL_HOSTS = 'customhost.com';
    expect(getPrimaryAdminHost()).toBe('customhost.com');
  });

  test('readEnvList returns empty array if env var is missing or empty', async () => {
    setNodeEnv('production');
    delete process.env.ADMIN_PORTAL_HOSTS;
    const { readEnvList } = await import(MODULE_PATH);
    expect(readEnvList('ADMIN_PORTAL_HOSTS')).toEqual([]);
    process.env.ADMIN_PORTAL_HOSTS = '';
    expect(readEnvList('ADMIN_PORTAL_HOSTS')).toEqual([]);
  });

  test('appendLocalFallbacks does not add localhost/127.0.0.1 in production', async () => {
    setNodeEnv('production');
    const { appendLocalFallbacks } = await import(MODULE_PATH);
    const hosts = ['admin.inkpup.ca'];
    expect(appendLocalFallbacks(hosts)).toEqual(['admin.inkpup.ca']);
  });

  test('appendLocalFallbacks adds localhost/127.0.0.1 in non-production', async () => {
    setNodeEnv('development');
    const { appendLocalFallbacks } = await import(MODULE_PATH);
    const hosts = ['admin.inkpup.ca'];
    const result = appendLocalFallbacks(hosts);
    expect(result).toEqual(expect.arrayContaining(['admin.inkpup.ca', 'localhost', '127.0.0.1']));
  });
});
