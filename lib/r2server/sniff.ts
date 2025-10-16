export function sniffContentType(buf: Buffer, fallbackName?: string): { contentType: string; ext: string } {
  const sig = buf.subarray(0, 12);
  const isJPEG = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
  const isPNG = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
  const isGIF = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x38;
  const isWEBP =
    sig[0] === 0x52 &&
    sig[1] === 0x49 &&
    sig[2] === 0x46 &&
    sig[3] === 0x46 &&
    sig[8] === 0x57 &&
    sig[9] === 0x45 &&
    sig[10] === 0x42 &&
    sig[11] === 0x50;

  if (isJPEG) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (isPNG) return { contentType: 'image/png', ext: 'png' };
  if (isGIF) return { contentType: 'image/gif', ext: 'gif' };
  if (isWEBP) return { contentType: 'image/webp', ext: 'webp' };

  if (fallbackName) {
    const lower = fallbackName.toLowerCase();
    if (lower.endsWith('.webp')) return { contentType: 'image/webp', ext: 'webp' };
    if (lower.endsWith('.png')) return { contentType: 'image/png', ext: 'png' };
    if (lower.endsWith('.gif')) return { contentType: 'image/gif', ext: 'gif' };
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return { contentType: 'image/jpeg', ext: 'jpg' };
  }

  return { contentType: 'application/octet-stream', ext: 'bin' };
}
