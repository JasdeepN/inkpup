'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Inquiry } from '@/lib/schemas/inquiry';

interface InquiryListProps {
  inquiries: Inquiry[];
}

export default function InquiryList({ inquiries }: InquiryListProps) {
  const searchParams = useSearchParams();
  const currentStatus = searchParams?.get('status') || 'all';

  if (inquiries.length === 0) {
    return (
      <div className="inquiry-empty">
        <div className="inquiry-empty__icon">📭</div>
        <h3>No inquiries yet</h3>
        <p className="text-muted">
          When visitors submit the contact form, their messages will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="inquiry-list">
      {inquiries.map((inquiry) => (
        <InquiryListItem
          key={inquiry.id}
          inquiry={inquiry}
          fromStatus={currentStatus}
        />
      ))}
    </div>
  );
}

interface InquiryListItemProps {
  inquiry: Inquiry;
  fromStatus: string;
}

function InquiryListItem({ inquiry, fromStatus }: InquiryListItemProps) {
  const isUnread = inquiry.status === 'unread';
  const typeEmoji = inquiry.inquiry_type === 'flash' ? '🎨' : inquiry.inquiry_type === 'custom' ? '✨' : '💬';
  const timeAgo = formatTimeAgo(inquiry.created_at);
  
  // Build detail URL with from param to preserve filter on back
  const detailUrl = `/dashboard/inquiries/${inquiry.id}${fromStatus !== 'all' ? `?from=${fromStatus}` : ''}`;

  return (
    <Link 
      href={detailUrl}
      className={`inquiry-item ${isUnread ? 'inquiry-item--unread' : ''}`}
    >
      <div className="inquiry-item__header">
        <div className="inquiry-item__status">
          {isUnread && <span className="inquiry-item__dot" aria-label="Unread" />}
        </div>

        <div className="inquiry-item__content">
          <div className="inquiry-item__top">
            <span className="inquiry-item__name">{inquiry.name}</span>
            <span className="inquiry-item__email text-muted">{inquiry.email}</span>
            <span className="inquiry-item__type">{typeEmoji}</span>
          </div>

          <div className="inquiry-item__preview">
            {inquiry.design_id && (
              <span className="inquiry-item__design">Design #{inquiry.design_id}</span>
            )}
            <span className="inquiry-item__message">
              {inquiry.message ? truncate(inquiry.message, 80) : 'No message'}
            </span>
          </div>
        </div>

        <div className="inquiry-item__meta">
          <span className="inquiry-item__time">{timeAgo}</span>
          <InquiryStatusBadge status={inquiry.status} />
          <span className="inquiry-item__chevron" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

function InquiryStatusBadge({ status }: { status: string }) {
  const labels: Record<string, { label: string; className: string }> = {
    unread: { label: 'Unread', className: 'inquiry-badge--unread' },
    read: { label: 'Read', className: 'inquiry-badge--read' },
    replied: { label: 'Awaiting', className: 'inquiry-badge--replied' },
    deposit_received: { label: '💰 Deposit', className: 'inquiry-badge--deposit_received' },
    booked: { label: 'Booked', className: 'inquiry-badge--booked' },
    archived: { label: 'Archived', className: 'inquiry-badge--archived' },
  };

  const { label, className } = labels[status] || { label: status, className: '' };

  return <span className={`inquiry-badge ${className}`}>{label}</span>;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}
