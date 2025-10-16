import { jest } from '@jest/globals';

describe('r2server config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('MAX_IMAGE_WIDTH uses positive R2_MAX_IMAGE_WIDTH env value', async () => {
    process.env.R2_MAX_IMAGE_WIDTH = '2048.4';
    jest.resetModules();
    const config = await import('./config');
    expect(config.MAX_IMAGE_WIDTH).toBe(2048);
  });

  test('MAX_IMAGE_WIDTH falls back to default when value is not positive number', async () => {
    process.env.R2_MAX_IMAGE_WIDTH = '-120';
    jest.resetModules();
    const config = await import('./config');
    expect(config.MAX_IMAGE_WIDTH).toBe(config.DEFAULT_MAX_IMAGE_WIDTH);
  });

  test('MAX_IMAGE_WIDTH ignores non-numeric values', async () => {
    process.env.R2_MAX_IMAGE_WIDTH = 'huge';
    jest.resetModules();
    const config = await import('./config');
    expect(config.MAX_IMAGE_WIDTH).toBe(config.DEFAULT_MAX_IMAGE_WIDTH);
  });

  test('credential environment variables are trimmed', async () => {
    process.env.R2_ACCOUNT_ID = ' acct '; 
    process.env.R2_BUCKET = ' bucket ';
    process.env.R2_ACCESS_KEY_ID = ' access ';
    process.env.R2_SECRET_ACCESS_KEY = ' secret ';
    process.env.R2_API_TOKEN = ' token ';
    jest.resetModules();
    const config = await import('./config');
    expect(config.accountId).toBe('acct');
    expect(config.bucket).toBe('bucket');
    expect(config.rawAccessKey).toBe('access');
    expect(config.rawSecretKey).toBe('secret');
    expect(config.rawApiToken).toBe('token');
  });
});
