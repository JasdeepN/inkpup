// Helper utility for Cloudflare R2 public URL resolution
export function resolveR2Url(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  const base = process.env.NEXT_PUBLIC_R2_BASE_URL || '';
  if (!base) return src;
  // ensure single slash between base and src
  return `${base.replace(/\/$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
}
