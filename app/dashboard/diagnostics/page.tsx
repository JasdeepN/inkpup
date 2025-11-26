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

export const dynamic = 'force-dynamic';

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
    // Check if KV namespace is bound (via globalThis in edge or env)
    const hasKV = Boolean(process.env.CACHE || (globalThis as any).CACHE);
    
    if (!hasKV) {
      return {
        name: 'Cloudflare KV Cache',
        status: 'degraded',
        message: 'KV namespace not bound',
        responseTime: Math.round(performance.now() - start),
      };
    }

    return {
      name: 'Cloudflare KV Cache',
      status: 'healthy',
      message: 'Namespace bound',
      responseTime: Math.round(performance.now() - start),
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

  // Run all health checks in parallel
  const [pricingHealth, r2Health, kvHealth, emailHealth] = await Promise.all([
    checkD1Health(),
    checkR2Health(),
    checkKVHealth(),
    checkEmailHealth(),
  ]);

  const services = [pricingHealth, r2Health, kvHealth, emailHealth];
  const allHealthy = services.every(s => s.status === 'healthy');
  const hasErrors = services.some(s => s.status === 'error');

  return (
    <div className="admin-shell admin-shell--full-width">
      <section className="admin-dashboard__hero">
        <div className="admin-card">
          <div>
            <p className="admin-dashboard__eyebrow">Infrastructure</p>
            <h1>System Diagnostics</h1>
            <p className="text-muted">Service health and performance monitoring</p>
          </div>
          <div className="mt-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              allHealthy ? 'bg-green-500/20 text-green-600' :
              hasErrors ? 'bg-red-500/20 text-red-600' :
              'bg-yellow-500/20 text-yellow-600'
            }`}>
              <span className={`w-3 h-3 rounded-full ${
                allHealthy ? 'bg-green-500' :
                hasErrors ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <span className="font-semibold">
                {allHealthy ? 'All Systems Operational' :
                 hasErrors ? 'Service Degradation' :
                 'Partial Degradation'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-dashboard__grid">
        {services.map((service) => (
          <div key={service.name} className="admin-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'degraded' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div>
                    <h2 className="text-xl font-semibold">{service.name}</h2>
                    <p className={`text-sm ${
                      service.status === 'healthy' ? 'text-green-600' :
                      service.status === 'degraded' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {service.message}
                    </p>
                  </div>
                </div>
                {service.responseTime !== undefined && (
                  <div className="text-right">
                    <div className="text-sm text-muted">Response Time</div>
                    <div className="font-mono text-lg">{service.responseTime}ms</div>
                  </div>
                )}
              </div>

              {service.details && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold mb-2 text-muted">Details</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(service.details).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted">{key}</dt>
                        <dd className="font-mono">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="admin-card">
        <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted mb-1">Runtime</dt>
              <dd className="font-mono">server</dd>
            </div>
            <div>
              <dt className="text-muted mb-1">Node Environment</dt>
              <dd className="font-mono">{process.env.NODE_ENV}</dd>
            </div>
            <div>
              <dt className="text-muted mb-1">D1 Binding Available</dt>
              <dd className="font-mono">
                {getD1Binding() ? 'true' : 'false'}
              </dd>
            </div>
          </dl>
        </div>
    </div>
  );
}
