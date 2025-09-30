// Signed URL client helper is intentionally disabled — images are public in R2.
export async function getSignedUrlClient(_key: string): Promise<null> {
  return null;
}

export async function prefetchSignedUrls(_keys: string[], _opts?: { expires?: number }) {
  return;
}

export function clearSignedUrlCache() {
  return;
}
