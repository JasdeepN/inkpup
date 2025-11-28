import { Suspense } from 'react';
import InquiryList from '@/components/admin/InquiryList';
import { getInquiriesAction, getUnreadCountAction } from '@/lib/admin-actions-inquiries';
import type { InquiryStatus } from '@/lib/schemas/inquiry';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = (params.status as InquiryStatus | 'all') || 'all';
  
  const [{ inquiries, error }, unreadCount] = await Promise.all([
    getInquiriesAction(statusFilter),
    getUnreadCountAction(),
  ]);

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <div className="admin-header mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">📬 Inquiries</h1>
            {unreadCount > 0 && (
              <span className="inquiry-badge inquiry-badge--unread">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="inquiry-filters mb-6">
          <StatusTab status="all" current={statusFilter} label="All" />
          <StatusTab status="unread" current={statusFilter} label="Unread" />
          <StatusTab status="read" current={statusFilter} label="Read" />
          <StatusTab status="replied" current={statusFilter} label="Awaiting" />
          <StatusTab status="deposit_received" current={statusFilter} label="💰 Deposit" />
          <StatusTab status="booked" current={statusFilter} label="Booked" />
          <StatusTab status="archived" current={statusFilter} label="Archived" />
        </div>

        {error ? (
          <div className="inquiry-error">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <Suspense fallback={<InquiryListSkeleton />}>
            <InquiryList inquiries={inquiries} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function StatusTab({
  status,
  current,
  label,
}: {
  status: InquiryStatus | 'all';
  current: InquiryStatus | 'all';
  label: string;
}) {
  const isActive = status === current;
  const href = status === 'all' ? '/dashboard/inquiries' : `/dashboard/inquiries?status=${status}`;

  return (
    <a
      href={href}
      className={`inquiry-filter-tab ${isActive ? 'inquiry-filter-tab--active' : ''}`}
    >
      {label}
    </a>
  );
}

function InquiryListSkeleton() {
  return (
    <div className="inquiry-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="inquiry-item inquiry-item--skeleton">
          <div className="inquiry-item__skeleton-line inquiry-item__skeleton-line--short" />
          <div className="inquiry-item__skeleton-line inquiry-item__skeleton-line--medium" />
          <div className="inquiry-item__skeleton-line inquiry-item__skeleton-line--long" />
        </div>
      ))}
    </div>
  );
}
