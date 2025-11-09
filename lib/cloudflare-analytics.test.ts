import {
  clearCloudflareAnalyticsCache,
  getCloudflareAnalyticsConfig,
  getCloudflareAnalyticsSummary,
  isCloudflareAnalyticsConfigured,
} from './cloudflare-analytics';

describe('cloudflare-analytics', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2025-11-01T12:00:00Z').getTime());
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    clearCloudflareAnalyticsCache();
    delete (globalThis as { fetch?: unknown }).fetch;
    jest.restoreAllMocks();
  });

  test('isCloudflareAnalyticsConfigured returns false without env vars', () => {
    delete process.env.CLOUDFLARE_ANALYTICS_TOKEN;
    delete process.env.CLOUDFLARE_ZONE_ID;
    expect(isCloudflareAnalyticsConfigured()).toBe(false);
  });

  test('returns null when configuration is missing', async () => {
    delete process.env.CLOUDFLARE_ANALYTICS_TOKEN;
    delete process.env.CLOUDFLARE_ZONE_ID;
    const summary = await getCloudflareAnalyticsSummary();
    expect(summary).toBeNull();
  });

  test('applies defaults when optional analytics env vars are missing or invalid', () => {
    process.env.CLOUDFLARE_ANALYTICS_TOKEN = '  padded-token  ';
    process.env.CLOUDFLARE_ZONE_ID = 'test-zone';
    process.env.CLOUDFLARE_ANALYTICS_ENDPOINT = '   ';
    process.env.CLOUDFLARE_ANALYTICS_CACHE_MS = 'not-a-number';

    expect(isCloudflareAnalyticsConfigured()).toBe(true);

    const resolvedConfig = getCloudflareAnalyticsConfig();
    expect(resolvedConfig).not.toBeNull();
    expect(resolvedConfig?.endpoint).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(resolvedConfig?.cacheTtlMs).toBe(300000);
    expect(resolvedConfig?.token).toBe('padded-token');
  });

  test('fetches and aggregates analytics data with caching', async () => {
    process.env.CLOUDFLARE_ANALYTICS_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ZONE_ID = 'test-zone';
    process.env.CLOUDFLARE_ANALYTICS_CACHE_MS = '300000';

    const fetchMock = jest.fn().mockImplementation(async (_url, init) => {
      const body = typeof init?.body === 'string' ? init.body : (init?.body ? init.body.toString() : '{}');
      const parsed = JSON.parse(body);
      const startTimestamp = parsed?.variables?.start ?? '2025-11-01T00:00:00Z';

      const groups = [
        {
          count: 60,
          dimensions: { datetimeHour: startTimestamp, cacheStatus: 'hit' },
          sum: {
            edgeResponseBytes: 6000,
            visits: 30,
          },
        },
        {
          count: 40,
          dimensions: { datetimeHour: startTimestamp, cacheStatus: 'miss' },
          sum: {
            edgeResponseBytes: 4000,
            visits: 20,
          },
        },
      ];

      return {
        ok: true,
        json: async () => ({
          data: {
            viewer: {
              zones: [
                {
                  httpRequestsAdaptiveGroups: groups,
                },
              ],
            },
          },
        }),
      };
    });

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const summary = await getCloudflareAnalyticsSummary();
    expect(summary).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(30);

    expect(summary?.windows['24h'].requests).toBe(100);
    expect(summary?.windows['7d'].requests).toBe(700);
    expect(summary?.windows['30d'].requests).toBe(3000);
    expect(summary?.windows['24h'].bytes).toBe(10000);
    expect(summary?.windows['7d'].cachedRequests).toBe(420);
    expect(summary?.cacheHitRate24h).toBeCloseTo(0.6, 5);
    expect(summary?.timeseries).toHaveLength(30);

    const cachedSummary = await getCloudflareAnalyticsSummary();
    expect(cachedSummary).toEqual(summary);
    expect(fetchMock).toHaveBeenCalledTimes(30);
  });

  test('reduces lookback when Cloudflare limits historic data', async () => {
    process.env.CLOUDFLARE_ANALYTICS_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ZONE_ID = 'test-zone';

    const fetchMock = jest.fn().mockImplementation(async (_url, init) => {
      const body = typeof init?.body === 'string' ? init.body : (init?.body ? init.body.toString() : '{}');
      const parsed = JSON.parse(body);
      const startTimestamp = parsed?.variables?.start ?? '2025-11-01T00:00:00Z';

      if (fetchMock.mock.calls.length === 1) {
        return {
          ok: true,
          json: async () => ({
            errors: [
              {
                message: 'zone "test" cannot request data older than 691200s',
              },
            ],
          }),
        };
      }

      const groups = [
        {
          count: 60,
          dimensions: { datetimeHour: startTimestamp, cacheStatus: 'hit' },
          sum: {
            edgeResponseBytes: 6000,
            visits: 30,
          },
        },
        {
          count: 40,
          dimensions: { datetimeHour: startTimestamp, cacheStatus: 'miss' },
          sum: {
            edgeResponseBytes: 4000,
            visits: 20,
          },
        },
      ];

      return {
        ok: true,
        json: async () => ({
          data: {
            viewer: {
              zones: [
                {
                  httpRequestsAdaptiveGroups: groups,
                },
              ],
            },
          },
        }),
      };
    });

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const summary = await getCloudflareAnalyticsSummary();
    expect(summary).not.toBeNull();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect(summary?.windows['24h'].requests).toBe(100);
    expect(summary?.windows['7d'].requests).toBe(700);
    expect(summary?.windows['30d'].requests).toBe(800);
    expect(summary?.timeseries).toHaveLength(8);
  });

  test('gracefully handles fetch errors and caches the failure briefly', async () => {
    process.env.CLOUDFLARE_ANALYTICS_TOKEN = 'test-token';
    process.env.CLOUDFLARE_ZONE_ID = 'test-zone';
    process.env.CLOUDFLARE_ANALYTICS_CACHE_MS = '120000';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const summary = await getCloudflareAnalyticsSummary();
    expect(summary).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();

    const cachedSummary = await getCloudflareAnalyticsSummary();
    expect(cachedSummary).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
