export const DEFAULT_MAX_IMAGE_WIDTH = 1800;
export const MAX_IMAGE_WIDTH = (() => {
  const raw = process.env.R2_MAX_IMAGE_WIDTH;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }
  return DEFAULT_MAX_IMAGE_WIDTH;
})();

export const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';
export const OPTIMIZED_CONTENT_TYPE = 'image/webp';

export const accountId = process.env.R2_ACCOUNT_ID?.trim();
export const bucket = process.env.R2_BUCKET?.trim();
export let rawAccessKey = process.env.R2_ACCESS_KEY_ID?.trim();
export let rawSecretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
export let rawApiToken = process.env.R2_API_TOKEN?.trim();

export const HEX_64 = /^[0-9a-f]{64}$/i;
export const TOKEN_ID_PATTERN = /^[0-9a-f]{32}$/i;
export const API_TOKEN_VALUE_PATTERN = /^v\d+\.\d+-/i;
