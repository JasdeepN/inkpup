const DEFAULT_SCHEME = 'https://';

function normalizeHostname(hostname: string): string | null {
  const trimmed = hostname.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `${DEFAULT_SCHEME}${trimmed}`);
    const basePath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.origin}${basePath}`;
  } catch {
    console.warn('R2_PUBLIC_HOSTNAME is not a valid URL:', hostname);
    return null;
  }
}

function buildDefaultR2Base(): string | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !bucket) {
    return null;
  }
  return `${DEFAULT_SCHEME}${accountId}.r2.cloudflarestorage.com/${bucket}`;
}

export function getR2PublicBaseUrl(): string | null {
  const preferred = process.env.R2_PUBLIC_HOSTNAME;
  if (preferred) {
    const normalized = normalizeHostname(preferred);
    if (normalized) {
      return normalized;
    }
  }
  return buildDefaultR2Base();
}

export function toPublicR2Url(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = getR2PublicBaseUrl();
  if (!base) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}
