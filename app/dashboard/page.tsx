import { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getUploadJobSummary, listGalleryImages } from '../../lib/r2-server';
import type { GalleryItem } from '../../lib/gallery-types';
import { getCategoryLabel } from '../../lib/gallery-types';
import JobSummary from '../../components/admin/JobSummary';
import StatCard, { StatDelta } from '../../components/admin/StatCard';
import {
  getCloudflareAnalyticsSummary,
  type CloudflareAnalyticsSummary,
} from '../../lib/cloudflare-analytics';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

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

function buildStats(summary: CloudflareAnalyticsSummary | null): Array<{
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

async function getRecentUploads(): Promise<{ items: GalleryItem[]; isFallback: boolean }> {
  try {
    const result = await listGalleryImages('available');
    return {
      items: result.items.slice(0, 6),
      isFallback: Boolean(result.isFallback),
    };
  } catch (error) {
    console.warn('Failed to fetch recent uploads', error);
    return { items: [], isFallback: false };
  }
}

function formatLastModified(item: GalleryItem): string {
  if (!item.lastModified) return 'Unknown';
  try {
    return new Date(item.lastModified).toLocaleString();
  } catch {
    return item.lastModified;
  }
}

export default async function AdminDashboardPage() {
  const [jobSummary, analyticsSummary, recentUploadsResult] = await Promise.all([
    getUploadJobSummary(),
    getCloudflareAnalyticsSummary(),
    getRecentUploads(),
  ]);

  const stats = buildStats(analyticsSummary);
  const { items: recentUploads, isFallback: recentUploadsFallback } = recentUploadsResult;

  return (
    <div className="admin-shell admin-dashboard">
      <section className="admin-dashboard__hero">
        <div className="admin-card admin-dashboard__intro">
          <div>
            <p className="admin-dashboard__eyebrow">Welcome back</p>
            <h1>Admin dashboard</h1>
            <p className="text-muted">
              Monitor site traffic, manage uploads, and keep gallery content up to date.
            </p>
          </div>
          <div className="admin-dashboard__actions">
            <Link className="btn btn--primary" href="/uploads">
              Upload artwork
            </Link>
            <Link className="btn btn--secondary" href="/gallery">
              Manage gallery
            </Link>
            <Link className="btn btn--secondary" href="/contact">
              View contact leads
            </Link>
          </div>
        </div>
        <JobSummary jobSummary={jobSummary} />
      </section>

      <section className="admin-dashboard__stats">
        {stats.map((stat) => (
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
      </section>

      <section className="admin-dashboard__grid">
        <article className="admin-card admin-dashboard__panel">
          <div className="admin-card__header">
            <h2>Recent uploads</h2>
            <p className="text-muted">Latest artwork added to the gallery.</p>
          </div>
          {recentUploads.length === 0 ? (
            <p className="text-muted">Uploads will appear here once content is added.</p>
          ) : (
            <>
              {recentUploadsFallback && (
                <p className="text-muted">Showing fallback examples because R2 is unavailable.</p>
              )}
              <ul className="admin-dashboard__list">
                {recentUploads.map((item) => (
                  <li key={item.id} className="admin-dashboard__list-item">
                    <div>
                      <p className="admin-dashboard__list-title">{item.caption ?? item.alt}</p>
                      <p className="admin-dashboard__list-meta">
                        {getCategoryLabel(item.category)} · {formatLastModified(item)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>

        <article className="admin-card admin-dashboard__panel">
          <div className="admin-card__header">
            <h2>Worker queue</h2>
            <p className="text-muted">Snapshot of the upload pipeline.</p>
          </div>
          <dl className="admin-dashboard__metrics">
            <div>
              <dt>Queued</dt>
              <dd>{jobSummary.queued}</dd>
            </div>
            <div>
              <dt>Scheduled retries</dt>
              <dd>{jobSummary.scheduled}</dd>
            </div>
            <div>
              <dt>Dead-lettered</dt>
              <dd>{jobSummary.deadLetter}</dd>
            </div>
            {jobSummary.oldestQueuedAt && (
              <div>
                <dt>Oldest queued</dt>
                <dd>{new Date(jobSummary.oldestQueuedAt).toLocaleString()}</dd>
              </div>
            )}
            {jobSummary.nextReadyAt && (
              <div>
                <dt>Next retry</dt>
                <dd>{new Date(jobSummary.nextReadyAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </article>

        <article className="admin-card admin-dashboard__panel">
          <div className="admin-card__header">
            <h2>Quick links</h2>
            <p className="text-muted">Common admin tools at your fingertips.</p>
          </div>
          <ul className="admin-dashboard__quick-links">
            <li><Link href="/uploads">Upload gallery images</Link></li>
            <li><Link href="/gallery">Review gallery content</Link></li>
            <li><Link href="/dashboard/diagnostics">System diagnostics</Link></li>
            <li><Link href="/api/admin/reciever">Webhook status</Link></li>
            <li><Link href="/contact">Incoming leads</Link></li>
          </ul>
        </article>
      </section>
    </div>
  );
}
