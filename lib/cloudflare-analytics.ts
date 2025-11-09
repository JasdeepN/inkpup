const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

export interface CloudflareAnalyticsConfig {
  endpoint: string;
  token: string;
  zoneId: string;
  cacheTtlMs: number;
}

export interface CloudflareAnalyticsTimeseriesPoint {
  timestamp: string;
  requests: number;
  cachedRequests: number;
  bytes: number;
  cachedBytes: number;
  visits: number;
}

export interface CloudflareAnalyticsWindow {
  label: '24h' | '7d' | '30d';
  requests: number;
  cachedRequests: number;
  bytes: number;
  cachedBytes: number;
  visits: number;
}

export interface CloudflareAnalyticsSummary {
  windows: Record<'24h' | '7d' | '30d', CloudflareAnalyticsWindow>;
  timeseries: CloudflareAnalyticsTimeseriesPoint[];
  cacheHitRate24h: number | null;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseCacheTtlMs(raw?: string): number {
  if (!raw) return DEFAULT_CACHE_TTL_MS;
  const ttl = Number(raw);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    return DEFAULT_CACHE_TTL_MS;
  }
  return Math.round(ttl);
}

export function getCloudflareAnalyticsConfig(): CloudflareAnalyticsConfig | null {
  const token = readEnv('CLOUDFLARE_ANALYTICS_TOKEN');
  const zoneId = readEnv('CLOUDFLARE_ZONE_ID');
  if (!token || !zoneId) {
    return null;
  }

  return {
    endpoint: readEnv('CLOUDFLARE_ANALYTICS_ENDPOINT') ?? 'https://api.cloudflare.com/client/v4/graphql',
    token,
    zoneId,
    cacheTtlMs: parseCacheTtlMs(readEnv('CLOUDFLARE_ANALYTICS_CACHE_MS')),
  };
}

export function isCloudflareAnalyticsConfigured(): boolean {
  return getCloudflareAnalyticsConfig() !== null;
}

const ANALYTICS_QUERY = `
  query CloudflareDashboardAnalytics($zoneTag: String!, $start: Time!, $end: Time!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequestsAdaptiveGroups(
          limit: 1000,
          orderBy: [datetimeHour_ASC],
          filter: { datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball" }
        ) {
          count
          sum {
            edgeResponseBytes
            visits
          }
          dimensions {
            datetimeHour
            cacheStatus
          }
        }
      }
    }
  }
`;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_QUERY_RANGE_MS = DAY_MS;
const WINDOW_LABELS = ['24h', '7d', '30d'] as const;
type WindowLabel = (typeof WINDOW_LABELS)[number];

type AdaptiveGroup = {
  count?: number | null;
  dimensions?: {
    datetimeHour?: string | null;
    cacheStatus?: string | null;
  } | null;
  sum?: {
    edgeResponseBytes?: number | null;
    visits?: number | null;
  } | null;
};

type GraphqlResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequestsAdaptiveGroups?: AdaptiveGroup[] | null;
      }> | null;
    } | null;
  } | null;
  errors?: Array<{ message?: string }>;
};

function extractMaxLookbackMs(error: unknown): number | null {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  if (!message) {
    return null;
  }
  const match = message.match(/older than\s+(\d+)s/i);
  if (!match) {
    return null;
  }
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return seconds * 1000;
}

async function fetchAdaptiveGroups(config: CloudflareAnalyticsConfig, startIso: string, endIso: string): Promise<AdaptiveGroup[]> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: ANALYTICS_QUERY,
      variables: {
        zoneTag: config.zoneId,
        start: startIso,
        end: endIso,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare analytics request failed with status ${response.status}`);
  }

  const body = (await response.json()) as GraphqlResponse;
  if (body.errors?.length) {
    const aggregated = body.errors.map((err) => err.message ?? 'Unknown error').join('; ');
    throw new Error(`Cloudflare analytics responded with errors: ${aggregated}`);
  }

  const zones = body.data?.viewer?.zones;
  if (!zones?.length) {
    return [];
  }

  const groups = zones[0]?.httpRequestsAdaptiveGroups;
  return Array.isArray(groups) ? groups : [];
}

async function fetchAdaptiveGroupsInRange(
  config: CloudflareAnalyticsConfig,
  startMs: number,
  endMs: number,
): Promise<AdaptiveGroup[]> {
  const aggregated: AdaptiveGroup[] = [];
  let cursor = startMs;

  // Cloudflare restricts httpRequestsAdaptiveGroups queries to <=24h ranges.
  while (cursor < endMs) {
    const chunkEndMs = Math.min(cursor + MAX_QUERY_RANGE_MS, endMs);
    let chunk: AdaptiveGroup[];
    try {
      chunk = await fetchAdaptiveGroups(config, new Date(cursor).toISOString(), new Date(chunkEndMs).toISOString());
    } catch (error) {
      const maxLookbackMs = extractMaxLookbackMs(error);
      if (maxLookbackMs !== null) {
        const earliestRawMs = endMs - maxLookbackMs + 1000;
        const safeCursor = Math.max(earliestRawMs, cursor + 1000);
        const alignedCursor = Math.ceil(safeCursor / HOUR_MS) * HOUR_MS;

        if (alignedCursor >= endMs) {
          return aggregated;
        }

        if (alignedCursor > cursor) {
          cursor = alignedCursor;
          startMs = alignedCursor;
          continue;
        }
      }
      throw error;
    }

    if (chunk.length) {
      aggregated.push(...chunk);
    }
    cursor = chunkEndMs;
  }

  return aggregated;
}

const toNumber = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const CACHED_STATUSES = new Set(['hit', 'stale', 'updating', 'revalidated']);

function createEmptyWindow(label: WindowLabel): CloudflareAnalyticsWindow {
  return {
    label,
    requests: 0,
    cachedRequests: 0,
    bytes: 0,
    cachedBytes: 0,
    visits: 0,
  };
}

function aggregateGroups(groups: AdaptiveGroup[], nowMs: number): CloudflareAnalyticsSummary {
  const windows: Record<WindowLabel, CloudflareAnalyticsWindow> = {
    '24h': createEmptyWindow('24h'),
    '7d': createEmptyWindow('7d'),
    '30d': createEmptyWindow('30d'),
  };

  const thresholds: Record<WindowLabel, number> = {
    '24h': nowMs - 24 * HOUR_MS,
    '7d': nowMs - 7 * DAY_MS,
    '30d': nowMs - 30 * DAY_MS,
  };

  const pointsByTimestamp = new Map<string, CloudflareAnalyticsTimeseriesPoint>();

  for (const group of groups) {
    const timestamp = group.dimensions?.datetimeHour;
    if (!timestamp) {
      continue;
    }

    const timestampMs = Date.parse(timestamp);
    if (!Number.isFinite(timestampMs) || timestampMs < thresholds['30d']) {
      continue;
    }

    let point = pointsByTimestamp.get(timestamp);
    if (!point) {
      point = {
        timestamp,
        requests: 0,
        cachedRequests: 0,
        bytes: 0,
        cachedBytes: 0,
        visits: 0,
      };
      pointsByTimestamp.set(timestamp, point);
    }

    const requestCount = toNumber(group.count);
    const sum = group.sum ?? {};
    const responseBytes = toNumber(sum.edgeResponseBytes);
    const visits = toNumber(sum.visits);
    point.requests += requestCount;
    point.bytes += responseBytes;
    point.visits += visits;

    const cacheStatus = group.dimensions?.cacheStatus?.toLowerCase();
    if (cacheStatus && CACHED_STATUSES.has(cacheStatus)) {
      point.cachedRequests += requestCount;
      point.cachedBytes += responseBytes;
    }
  }

  const timeseries = Array.from(pointsByTimestamp.values()).sort((a, b) =>
    Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );

  for (const point of timeseries) {
    const timestampMs = Date.parse(point.timestamp);
    if (!Number.isFinite(timestampMs)) {
      continue;
    }

    for (const label of WINDOW_LABELS) {
      if (timestampMs >= thresholds[label]) {
        const window = windows[label];
        window.requests += point.requests;
        window.cachedRequests += point.cachedRequests;
        window.bytes += point.bytes;
        window.cachedBytes += point.cachedBytes;
        window.visits += point.visits;
      }
    }
  }

  const cacheHitRate24h = windows['24h'].requests > 0 ? windows['24h'].cachedRequests / windows['24h'].requests : null;

  return {
    windows,
    timeseries,
    cacheHitRate24h,
  };
}

type CacheEntry = {
  summary: CloudflareAnalyticsSummary | null;
  expiresAt: number;
};

let cacheEntry: CacheEntry | null = null;

function setCache(summary: CloudflareAnalyticsSummary | null, ttlMs: number) {
  cacheEntry = {
    summary,
    expiresAt: Date.now() + ttlMs,
  };
}

export function clearCloudflareAnalyticsCache() {
  cacheEntry = null;
}

export async function getCloudflareAnalyticsSummary(): Promise<CloudflareAnalyticsSummary | null> {
  const config = getCloudflareAnalyticsConfig();
  if (!config) {
    return null;
  }

  const now = Date.now();
  if (cacheEntry && cacheEntry.expiresAt > now) {
    return cacheEntry.summary;
  }

  const endMs = now;
  const startMs = now - 30 * DAY_MS;

  try {
    const groups = await fetchAdaptiveGroupsInRange(config, startMs, endMs);
    const summary = aggregateGroups(groups, now);
    setCache(summary, config.cacheTtlMs);
    return summary;
  } catch (error) {
    console.error('Failed to fetch Cloudflare analytics summary', error);
    const fallbackTtl = Math.min(config.cacheTtlMs, 60 * 1000);
    setCache(null, fallbackTtl);
    return null;
  }
}
