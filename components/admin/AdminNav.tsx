import Link from 'next/link';
import { getUnreadCountAction } from '@/lib/admin-actions-inquiries';

export default async function AdminNav() {
  // Fetch unread inquiry count for badge
  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCountAction();
  } catch {
    // Silently fail - badge just won't show
  }

  return (
    <nav className="admin-card admin-nav admin-card--compact flex items-center justify-between mb-6" aria-label="Admin navigation">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="nav-brand font-semibold text-lg">
          ADMIN
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/gallery" className="nav-link">
            Gallery
          </Link>
          <Link href="/dashboard/pricing" className="nav-link">
            Pricing
          </Link>
          <Link href="/dashboard/hero" className="nav-link">
            Hero
          </Link>
          <Link href="/dashboard/inquiries" className="nav-link nav-link--with-badge">
            Inquiries
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
          <Link href="/dashboard/customers" className="nav-link">
            Customers
          </Link>
          <Link href="/dashboard/templates" className="nav-link">
            Templates
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/diagnostics" className="nav-link">
          Diagnostics
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="nav-link">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
