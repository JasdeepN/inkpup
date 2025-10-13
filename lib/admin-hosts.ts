const DEFAULT_ADMIN_HOSTS = Object.freeze([
  'admin.inkpup.ca',
  'dev.admin.inkpup.ca',
  'admin.devapp.lan',
]);

function readEnvList(name: string): string[] {
  const raw = process.env[name];
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeHost(value: string | null | undefined): string | null {
  if (!value) return null;

  const [host] = value.split(':');
  return host?.toLowerCase() ?? null;
}

export function getAdminHosts(): readonly string[] {
  const envHosts = readEnvList('ADMIN_PORTAL_HOSTS');
  if (envHosts.length > 0) {
    return appendLocalFallbacks(envHosts);
  }

  return appendLocalFallbacks([...DEFAULT_ADMIN_HOSTS]);
}

function appendLocalFallbacks(hosts: string[]): readonly string[] {
  if (process.env.NODE_ENV === 'production') {
    return hosts;
  }

  const augmented = new Set(hosts);
  augmented.add('localhost');
  augmented.add('127.0.0.1');

  return Array.from(augmented);
}

export function isAdminHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  return getAdminHosts().some((candidate) => normalizeHost(candidate) === normalized);
}

export function getPrimaryAdminHost(): string | null {
  const hosts = getAdminHosts();
  return hosts.length > 0 ? hosts[0] : null;
}

// The admin app is implemented at an internal route ("/admin"). Middleware
// rewrites requests on admin-only hosts to this path so the portal appears at
// the subdomain root without conflicting with the public homepage.
export const ADMIN_INTERNAL_PATH = '/admin';
export const ADMIN_PUBLIC_BASE_PATH = '/';
