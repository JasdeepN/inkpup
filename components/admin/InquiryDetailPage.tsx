'use client';

import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Inquiry } from '@/lib/schemas/inquiry';
import { updateInquiryStatusAction } from '@/lib/admin-actions-inquiries';
import InquiryDetail from './InquiryDetail';

interface InquiryDetailPageProps {
  inquiry: Inquiry;
  backUrl: string;
  fromStatus?: string;
}

/**
 * Wrapper component for the dedicated inquiry detail page.
 * Handles:
 * - Back navigation with auto-mark-read
 * - Mark as Read/Unread buttons
 * - Status display badge
 */
export default function InquiryDetailPage({ 
  inquiry: initialInquiry, 
  backUrl,
  fromStatus,
}: InquiryDetailPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [inquiry, setInquiry] = useState(initialInquiry);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isUnread = inquiry.status === 'unread';

  // Mark as read helper - called on various actions
  const markAsRead = useCallback(async () => {
    if (inquiry.status === 'unread') {
      const result = await updateInquiryStatusAction(inquiry.id, 'read');
      if (!result?.error) {
        setInquiry(prev => ({ ...prev, status: 'read' }));
      }
      return result;
    }
    return null;
  }, [inquiry.id, inquiry.status]);

  // Handle back button click - mark read before navigating
  const handleBackClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isUnread) {
      e.preventDefault();
      startTransition(async () => {
        await markAsRead();
        router.push(backUrl);
      });
    }
    // If not unread, let the Link navigate normally
  }, [isUnread, markAsRead, router, backUrl]);

  // Explicit mark as read button
  const handleMarkAsRead = useCallback(() => {
    startTransition(async () => {
      const result = await markAsRead();
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else if (result) {
        setMessage({ type: 'success', text: 'Marked as read' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  }, [markAsRead]);

  // Mark as unread button
  const handleMarkAsUnread = useCallback(() => {
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, 'unread');
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setInquiry(prev => ({ ...prev, status: 'unread' }));
        setMessage({ type: 'success', text: 'Marked as unread' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  }, [inquiry.id]);

  // Callback for InquiryDetail to notify us of status changes
  const handleStatusChange = useCallback((newStatus: Inquiry['status']) => {
    setInquiry(prev => ({ ...prev, status: newStatus }));
  }, []);

  // Get inquiry type emoji
  const typeEmoji = {
    flash: '🎨',
    custom: '✨',
    contact: '💬',
  }[inquiry.inquiry_type] || '💬';

  // Format time as actual time (not relative)
  const receivedTime = new Date(inquiry.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="inquiry-detail-page admin-card">
      {/* Header with back button and actions */}
      <div className="inquiry-detail-page__header">
        <Link 
          href={backUrl}
          className="inquiry-detail-page__back"
          onClick={handleBackClick}
        >
          ← Back to messages
        </Link>
        
        <div className="inquiry-detail-page__actions">
          {isUnread ? (
            <button
              type="button"
              className="btn btn--sm btn--outline"
              onClick={handleMarkAsRead}
              disabled={isPending}
            >
              ✓ Mark as Read
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--sm btn--outline"
              onClick={handleMarkAsUnread}
              disabled={isPending}
            >
              Mark as Unread
            </button>
          )}
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div className={`inquiry-message inquiry-message--${message.type} mb-4`}>
          {message.text}
        </div>
      )}

      {/* Inquiry header info */}
      <div className="inquiry-detail-page__info mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">{inquiry.name}</h2>
            <p className="text-muted">
              {inquiry.email} · {typeEmoji} {inquiry.inquiry_type.charAt(0).toUpperCase() + inquiry.inquiry_type.slice(1)}
            </p>
          </div>
          <div className="text-right">
            <InquiryStatusBadge status={inquiry.status} />
            <p className="text-muted text-sm mt-1">{receivedTime}</p>
          </div>
        </div>
      </div>

      {/* Main detail component - pass callback for deferred read marking */}
      <InquiryDetail 
        inquiry={inquiry} 
        onStatusChange={handleStatusChange}
        onActionTaken={markAsRead}
      />
    </div>
  );
}

function InquiryStatusBadge({ status }: { status: string }) {
  // For archived status, show just the archived badge
  if (status === 'archived') {
    return (
      <span className="inquiry-badge inquiry-status-badge--archived">
        📦 ARCHIVED
      </span>
    );
  }

  // For unread, show unread badge
  if (status === 'unread') {
    return (
      <span className="inquiry-badge inquiry-status-badge--unread">
        🔵 UNREAD
      </span>
    );
  }

  // For all other statuses, show READ badge
  return (
    <span className="inquiry-badge inquiry-status-badge--read">
      READ
    </span>
  );
}
