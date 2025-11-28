import { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardStats } from '../../lib/dashboard-stats';
import DashboardStatCard from '../../components/admin/DashboardStatCard';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

// Dashboard fetches live stats - skip static prerendering
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    console.error('[Dashboard] Failed to load stats:', error);
    // Return error state instead of throwing
    return (
      <div className="admin-shell">
        <div className="admin-card admin-alert admin-alert--error">
          <h2>Dashboard Error</h2>
          <p>Failed to load dashboard statistics. Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <pre style={{ fontSize: '0.75rem', marginTop: '1rem', overflow: 'auto' }}>
            {error instanceof Error ? error.stack : JSON.stringify(error)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-dashboard">
      {/* Hero Section */}
      <section className="admin-dashboard__hero">
        <div className="admin-card admin-dashboard__intro">
          <div>
            <p className="admin-dashboard__eyebrow">Welcome back</p>
            <h1>Admin dashboard</h1>
            <p className="text-muted">
              Manage your gallery, respond to inquiries, and keep content fresh.
            </p>
          </div>
          <div className="admin-dashboard__actions">
            <Link className="btn btn--primary" href="/gallery">
              Upload artwork
            </Link>
            <Link className="btn btn--secondary" href="/gallery">
              Manage gallery
            </Link>
            <Link className="btn btn--secondary" href="/dashboard/inquiries">
              {stats.inquiries.unread > 0 ? (
                <>View inbox <span className="badge badge--danger">{stats.inquiries.unread}</span></>
              ) : (
                'View inbox'
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* Business Stats Grid */}
      <section className="admin-dashboard__stats-grid">
        {/* Row 1 */}
        <DashboardStatCard
          icon={<span aria-hidden="true">📬</span>}
          title="Inquiries"
          value={stats.inquiries.unread}
          subtitle={stats.inquiries.unread === 1 ? 'unread message' : 'unread messages'}
          href="/dashboard/inquiries"
          linkText="View Inbox"
          highlight={stats.inquiries.unread > 0}
        />
        <DashboardStatCard
          icon={<span aria-hidden="true">🎨</span>}
          title="Flash Designs"
          value={stats.gallery.flash}
          subtitle="ready to book"
          href="/gallery?category=flash"
          linkText="Manage"
        />
        <DashboardStatCard
          icon={<span aria-hidden="true">✨</span>}
          title="Available"
          value={stats.gallery.available}
          subtitle="bookable designs"
          href="/gallery?category=available"
          linkText="View"
        />

        {/* Row 2 */}
        <DashboardStatCard
          icon={<span aria-hidden="true">💉</span>}
          title="Healed Work"
          value={stats.gallery.healed}
          subtitle="portfolio pieces"
          href="/gallery?category=healed"
          linkText="View"
        />
        <DashboardStatCard
          icon={<span aria-hidden="true">📝</span>}
          title="Email Templates"
          value={stats.templates.count}
          subtitle="reply templates"
          href="/dashboard/templates"
          linkText="Edit"
        />
        <DashboardStatCard
          icon={<span aria-hidden="true">⚙️</span>}
          title="Diagnostics"
          value="—"
          subtitle="system health"
          href="/dashboard/diagnostics"
          linkText="View"
        />
      </section>
    </div>
  );
}
