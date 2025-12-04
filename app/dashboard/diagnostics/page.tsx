/**
 * Admin Diagnostics - Service Health Dashboard
 * Protected admin page showing status of all infrastructure dependencies
 */

import { isAdminHost } from '../../../lib/admin-hosts';
import { verifySessionToken, getSessionCookieOptions } from '../../../lib/admin-auth';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { pricing } from '../../../lib/pricing';
import { getD1Binding, getSizeCategories, getStyles, getColorProfiles } from '../../../lib/db/d1';
import StatCard, { StatDelta } from '../../../components/admin/StatCard';
import {
  getCloudflareAnalyticsSummary,
  type CloudflareAnalyticsSummary,
} from '../../../lib/cloudflare-analytics';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

// Analytics formatting helpers
const DAY_MS = 24 * 60 * 60 * 1000;

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const byteFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

type AnalyticsField = 'requests' | 'visits' | 'bytes' | 'cachedBytes';

function formatNumber(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return numberFormatter.format(value);
}

function formatBytes(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  if (value < 1_000_000) {
    return `${numberFormatter.format(value)} B`;
  }
  return `${byteFormatter.format(value)}B`;
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return percentFormatter.format(value);
}

function sumField(summary: CloudflareAnalyticsSummary, field: AnalyticsField, start: number, end: number): number {
  return summary.timeseries.reduce((total, point) => {
    const time = Date.parse(point.timestamp);
    if (!Number.isFinite(time) || time < start || time >= end) {
      return total;
    }

    switch (field) {
      case 'requests':
        return total + point.requests;
      case 'visits':
        return total + point.visits;
      case 'bytes':
        return total + point.bytes;
      case 'cachedBytes':
        return total + point.cachedBytes;
      default:
        return total;
    }
  }, 0);
}

function computeDelta(summary: CloudflareAnalyticsSummary | null, field: AnalyticsField): StatDelta | undefined {
  if (!summary) return undefined;
  const now = Date.now();
  const current = sumField(summary, field, now - DAY_MS, now);
  const previous = sumField(summary, field, now - 2 * DAY_MS, now - DAY_MS);
  if (previous <= 0) {
    return undefined;
  }
  const deltaValue = (current - previous) / previous;
  return {
    value: deltaValue,
    format: 'percent',
    label: 'vs prev. day',
  };
}

function buildAnalyticsStats(summary: CloudflareAnalyticsSummary | null): Array<{
  key: string;
  title: string;
  value: string;
  description: string;
  delta?: StatDelta;
  trend?: number[];
  error?: string;
  icon?: ReactNode;
}> {
  if (!summary) {
    return [
      {
        key: 'requests',
        title: 'Requests (24h)',
        value: '—',
        description: 'Connect Cloudflare analytics to populate traffic trends.',
        error: 'Cloudflare analytics unavailable',
        icon: <span aria-hidden="true">📈</span>,
      },
      {
        key: 'visits',
        title: 'Visits (24h)',
        value: '—',
        description: 'Set CLOUDFLARE_* env vars to enable visit tracking.',
        error: 'Cloudflare analytics unavailable',
        icon: <span aria-hidden="true">👥</span>,
      },
      {
        key: 'bandwidth',
        title: 'Bandwidth (24h)',
        value: '—',
        description: 'Bandwidth metrics require Cloudflare analytics access.',
        error: 'Cloudflare analytics unavailable',
        icon: <span aria-hidden="true">🛰️</span>,
      },
      {
        key: 'cache',
        title: 'Cache hit rate',
        value: '—',
        description: 'Caching insight unavailable until Cloudflare analytics is configured.',
        error: 'Cloudflare analytics unavailable',
        icon: <span aria-hidden="true">🗄️</span>,
      },
    ];
  }

  const window24h = summary.windows['24h'];
  const window7d = summary.windows['7d'];
  const trendRequests = summary.timeseries.map((point) => point.requests);
  const trendVisits = summary.timeseries.map((point) => point.visits);
  const trendBytes = summary.timeseries.map((point) => point.bytes);

  return [
    {
      key: 'requests',
      title: 'Requests (24h)',
      value: formatNumber(window24h.requests),
      description: `${formatNumber(window7d.requests)} requests this week`,
      delta: computeDelta(summary, 'requests'),
      trend: trendRequests,
      icon: <span aria-hidden="true">📈</span>,
    },
    {
      key: 'visits',
      title: 'Visits (24h)',
      value: formatNumber(window24h.visits),
      description: `${formatNumber(window7d.visits)} visits this week`,
      delta: computeDelta(summary, 'visits'),
      trend: trendVisits,
      icon: <span aria-hidden="true">👥</span>,
    },
    {
      key: 'bandwidth',
      title: 'Bandwidth (24h)',
      value: formatBytes(window24h.bytes),
      description: `${formatBytes(summary.windows['7d'].bytes)} transferred this week`,
      delta: computeDelta(summary, 'bytes'),
      trend: trendBytes,
      icon: <span aria-hidden="true">🛰️</span>,
    },
    {
      key: 'cache',
      title: 'Cache hit rate',
      value: formatPercent(summary.cacheHitRate24h),
      description: 'Caching efficiency over the last 24 hours',
      trend: summary.timeseries.map((point) => {
        const total = point.requests || 0;
        if (!total) return 0;
        return point.cachedRequests / total;
      }),
      delta: undefined,
      icon: <span aria-hidden="true">🗄️</span>,
    },
  ];
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'error';
  message: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

async function checkD1Health(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    // First, try to get D1 binding (only available in Cloudflare Workers)
    const db = getD1Binding();
    
    if (db) {
      // D1 is available - query actual database
      const [sizes, styles, colors] = await Promise.all([
        getSizeCategories(db),
        getStyles(db),
        getColorProfiles(db),
      ]);
      
      const responseTime = Math.round(performance.now() - start);
      const hasData = sizes.length > 0 && styles.length > 0 && colors.length > 0;
      
      if (!hasData) {
        return {
          name: 'Cloudflare D1 Database',
          status: 'degraded',
          message: 'Connected but data incomplete',
          responseTime,
          details: {
            source: 'D1 (live)',
            sizeCategories: sizes.length,
            styles: styles.length,
            colorProfiles: colors.length,
          }
        };
      }
      
      return {
        name: 'Cloudflare D1 Database',
        status: 'healthy',
        message: 'Connected and data loaded',
        responseTime,
        details: {
          source: 'D1 (live)',
          sizeCategories: sizes.length,
          styles: styles.length,
          colorProfiles: colors.length,
        }
      };
    }
    
    // D1 not available (local dev) - fall back to JSON
    const data = pricing;
    const responseTime = Math.round(performance.now() - start);
    
    const hasData = data.sizeCategories.length > 0 && 
                    data.colorProfiles.length > 0;
    
    if (!hasData) {
      return {
        name: 'Cloudflare D1 Database',
        status: 'degraded',
        message: 'D1 unavailable, using JSON fallback (incomplete)',
        responseTime,
        details: {
          source: 'JSON fallback',
          sizeCategories: data.sizeCategories.length,
          styles: (data as any).styles?.length || data.complexityMultipliers?.length || 0,
          colorProfiles: data.colorProfiles.length,
          note: 'D1 only available in Cloudflare Workers environment',
        }
      };
    }

    return {
      name: 'Cloudflare D1 Database',
      status: 'degraded',
      message: 'D1 unavailable, using JSON fallback',
      responseTime,
      details: {
        source: 'JSON fallback',
        sizeCategories: data.sizeCategories.length,
        styles: (data as any).styles?.length || data.complexityMultipliers?.length || 0,
        colorProfiles: data.colorProfiles.length,
        note: 'D1 only available in Cloudflare Workers environment',
      }
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);
    return {
      name: 'Cloudflare D1 Database',
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect',
      responseTime,
    };
  }
}

async function checkR2Health(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    // Check if R2 env vars are configured
    const bucket = (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME)?.trim();
    const hasAccessPair = Boolean(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
    const hasApiToken = Boolean(process.env.R2_API_TOKEN);
    const hasConfig = Boolean(process.env.R2_ACCOUNT_ID && bucket && (hasAccessPair || hasApiToken));

    if (!hasConfig) {
      return {
        name: 'Cloudflare R2 Storage',
        status: 'error',
        message: 'R2 credentials not configured',
        responseTime: Math.round(performance.now() - start),
        details: {
          accountIdPresent: Boolean(process.env.R2_ACCOUNT_ID),
          bucketPresent: Boolean(bucket),
          accessKeyPresent: Boolean(process.env.R2_ACCESS_KEY_ID),
          secretKeyPresent: Boolean(process.env.R2_SECRET_ACCESS_KEY),
          apiTokenPresent: Boolean(process.env.R2_API_TOKEN),
        }
      };
    }

    const forcedS3 = process.env.R2_FORCE_S3 === 'true';

    return {
      name: 'Cloudflare R2 Storage',
      status: 'healthy',
      message: forcedS3 ? 'Credentials configured (S3 client forced)' : 'Credentials configured',
      responseTime: Math.round(performance.now() - start),
      details: {
        accountId: process.env.R2_ACCOUNT_ID,
        bucketName: bucket,
        authMode: hasApiToken && !hasAccessPair ? 'api-token' : 'access-key',
        publicHostname: process.env.R2_PUBLIC_HOSTNAME || 'not set',
        forcedS3,
      }
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);
    return {
      name: 'Cloudflare R2 Storage',
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
      responseTime,
    };
  }
}

async function checkKVHealth(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    // Try to get KV binding through Cloudflare context first
    let hasKV = false;
    
    // Check via getCloudflareContext (preferred for OpenNext)
    try {
      const cloudflareSymbol = Symbol.for('__cloudflare-context__');
      const ctx = (globalThis as any)[cloudflareSymbol];
      if (ctx?.env?.CACHE) {
        hasKV = true;
      }
    } catch {
      // Ignore - try other methods
    }
    
    // Fallback: check globalThis.CACHE or dev shim
    if (!hasKV) {
      hasKV = Boolean((globalThis as any).CACHE);
    }
    
    if (!hasKV) {
      return {
        name: 'Cloudflare KV Cache',
        status: 'degraded',
        message: 'KV namespace not bound',
        responseTime: Math.round(performance.now() - start),
        details: {
          note: 'KV binding configured in wrangler.toml but not available in current context',
          hint: 'KV is available when running via Cloudflare Workers',
        }
      };
    }

    return {
      name: 'Cloudflare KV Cache',
      status: 'healthy',
      message: 'Namespace bound',
      responseTime: Math.round(performance.now() - start),
      details: {
        binding: 'CACHE',
      }
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);
    return {
      name: 'Cloudflare KV Cache',
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
      responseTime,
    };
  }
}

async function checkEmailHealth(): Promise<ServiceHealth> {
  const start = performance.now();
  try {
    const hasConfig = Boolean(
      process.env.RESEND_API_KEY &&
      process.env.CONTACT_EMAIL
    );

    if (!hasConfig) {
      return {
        name: 'Email Service (Resend)',
        status: 'error',
        message: 'Email credentials not configured',
        responseTime: Math.round(performance.now() - start),
      };
    }

    return {
      name: 'Email Service (Resend)',
      status: 'healthy',
      message: 'API key configured',
      responseTime: Math.round(performance.now() - start),
      details: {
        contactEmail: process.env.CONTACT_EMAIL,
      }
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);
    return {
      name: 'Email Service (Resend)',
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
      responseTime,
    };
  }
}

async function checkRealtimeHealth(): Promise<ServiceHealth> {
  const start = performance.now();
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    // Try to get REALTIME service binding via Cloudflare context
    let hasBinding = false;
    let realtimeService: any = null;
    
    try {
      const cloudflareSymbol = Symbol.for('__cloudflare-context__');
      const ctx = (globalThis as any)[cloudflareSymbol];
      if (ctx?.env?.REALTIME) {
        hasBinding = true;
        realtimeService = ctx.env.REALTIME;
      }
    } catch {
      // Ignore - binding not available
    }
    
    // If no binding in Workers, try getCloudflareContext
    if (!hasBinding) {
      try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        const cfContext = await getCloudflareContext();
        if (cfContext?.env?.REALTIME) {
          hasBinding = true;
          realtimeService = cfContext.env.REALTIME;
        }
      } catch {
        // Not in OpenNext context
      }
    }
    
    if (!hasBinding || !realtimeService) {
      // In local dev, service bindings aren't available - that's expected
      if (isDev) {
        return {
          name: 'Realtime Worker (DO)',
          status: 'degraded',
          message: 'Not available in local dev',
          responseTime: Math.round(performance.now() - start),
          details: {
            binding: 'REALTIME',
            environment: 'development',
            note: 'Service bindings only work in deployed Workers',
            localTest: 'curl http://localhost:8787/health',
          }
        };
      }
      return {
        name: 'Realtime Worker (DO)',
        status: 'degraded',
        message: 'Service binding not configured',
        responseTime: Math.round(performance.now() - start),
        details: {
          binding: 'REALTIME',
          hint: 'Add [[services]] binding in wrangler.toml',
        }
      };
    }
    
    // Call health endpoint via service binding
    try {
      const healthResponse = await realtimeService.fetch(
        new Request('https://realtime/health', { method: 'GET' })
      );
      
      if (!healthResponse.ok) {
        return {
          name: 'Realtime Worker (DO)',
          status: 'error',
          message: `Health check failed: ${healthResponse.status}`,
          responseTime: Math.round(performance.now() - start),
          details: {
            binding: 'REALTIME',
            httpStatus: healthResponse.status,
          }
        };
      }
      
      const healthData = await healthResponse.json() as { ok: boolean; connections: number; timestamp: string };
      
      return {
        name: 'Realtime Worker (DO)',
        status: healthData.ok ? 'healthy' : 'degraded',
        message: healthData.ok ? 'Worker responding' : 'Worker unhealthy',
        responseTime: Math.round(performance.now() - start),
        details: {
          binding: 'REALTIME',
          connections: healthData.connections,
          lastCheck: healthData.timestamp,
        }
      };
    } catch (fetchError) {
      // In local dev, the binding object exists but fetch fails - expected
      if (isDev) {
        return {
          name: 'Realtime Worker (DO)',
          status: 'degraded',
          message: 'Not available in local dev',
          responseTime: Math.round(performance.now() - start),
          details: {
            binding: 'REALTIME',
            environment: 'development',
            note: 'Service bindings only work in deployed Workers',
            localTest: 'curl http://localhost:8787/health',
          }
        };
      }
      return {
        name: 'Realtime Worker (DO)',
        status: 'error',
        message: fetchError instanceof Error ? fetchError.message : 'Failed to reach worker',
        responseTime: Math.round(performance.now() - start),
        details: {
          binding: 'REALTIME',
          error: 'Service binding fetch failed',
        }
      };
    }
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);
    if (isDev) {
      return {
        name: 'Realtime Worker (DO)',
        status: 'degraded',
        message: 'Not available in local dev',
        responseTime,
        details: {
          binding: 'REALTIME',
          environment: 'development',
          localTest: 'curl http://localhost:8787/health',
        }
      };
    }
    return {
      name: 'Realtime Worker (DO)',
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
      responseTime,
    };
  }
}

export default async function DiagnosticsPage() {
  // Verify admin authentication
  const headersList = await headers();
  const host = headersList.get('host');
  
  if (!isAdminHost(host)) {
    redirect('/');
  }

  const cookieStore = await cookies();
  const { name: cookieName } = getSessionCookieOptions();
  const sessionToken = cookieStore.get(cookieName)?.value;
  const isAuthenticated = sessionToken ? verifySessionToken(sessionToken) : false;

  if (!isAuthenticated) {
    redirect('/admin');
  }

  // Run all health checks and analytics in parallel
  const [pricingHealth, r2Health, kvHealth, emailHealth, realtimeHealth, analyticsSummary] = await Promise.all([
    checkD1Health(),
    checkR2Health(),
    checkKVHealth(),
    checkEmailHealth(),
    checkRealtimeHealth(),
    getCloudflareAnalyticsSummary(),
  ]);

  const services = [pricingHealth, r2Health, kvHealth, emailHealth, realtimeHealth];
  const allHealthy = services.every(s => s.status === 'healthy');
  const hasErrors = services.some(s => s.status === 'error');
  const analyticsStats = buildAnalyticsStats(analyticsSummary);

  return (
    <div className="admin-shell admin-shell--full-width">
      {/* Header Section */}
      <section className="mb-8">
        <div className="admin-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="admin-dashboard__eyebrow">Infrastructure</p>
              <h1 className="text-2xl font-bold">System Diagnostics</h1>
              <p className="text-muted text-sm mt-1">Service health and performance monitoring</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full self-start ${
              allHealthy ? 'bg-green-500/20 text-green-400' :
              hasErrors ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              <span className={`w-3 h-3 rounded-full ${
                allHealthy ? 'bg-green-500' :
                hasErrors ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <span className="font-semibold text-sm">
                {allHealthy ? 'All Systems Operational' :
                 hasErrors ? 'Service Degradation' :
                 'Partial Degradation'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Traffic Analytics Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Traffic Analytics</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {analyticsStats.map((stat) => (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              delta={stat.delta}
              trend={stat.trend}
              trendLabel={`${stat.title} trend`}
              icon={stat.icon}
              error={stat.error}
            />
          ))}
        </div>
      </section>

      {/* Services Grid - 2x2 on desktop */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {services.map((service) => (
          <article key={service.name} className="admin-card">
            {/* Service Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  service.status === 'healthy' ? 'bg-green-500' :
                  service.status === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <h2 className="text-lg font-semibold">{service.name}</h2>
                  <p className={`text-sm ${
                    service.status === 'healthy' ? 'text-green-400' :
                    service.status === 'degraded' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {service.message}
                  </p>
                </div>
              </div>
              {service.responseTime !== undefined && (
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted">Response Time</div>
                  <div className="font-mono text-sm">{service.responseTime}ms</div>
                </div>
              )}
            </div>

            {/* Service Details */}
            {service.details && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-semibold mb-3 text-muted uppercase tracking-wide">Details</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(service.details).map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-muted text-xs">{key}</dt>
                      <dd className="font-mono text-xs truncate" title={String(value)}>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Environment Section */}
      <section>
        <div className="admin-card">
          <h2 className="text-lg font-semibold mb-4">Environment</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="text-muted text-xs mb-1">Runtime</dt>
              <dd className="font-mono">server</dd>
            </div>
            <div>
              <dt className="text-muted text-xs mb-1">Node Environment</dt>
              <dd className="font-mono">{process.env.NODE_ENV}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs mb-1">D1 Binding Available</dt>
              <dd className="font-mono">
                {getD1Binding() ? 'true' : 'false'}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
