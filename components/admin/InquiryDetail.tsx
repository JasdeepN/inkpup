'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Inquiry, EmailTemplate, InquiryEmail } from '@/lib/schemas/inquiry';
import {
  updateInquiryStatusAction,
  updateInquiryNotesAction,
  getTemplatesForReplyAction,
  sendReplyAction,
  getInquiryAction,
} from '@/lib/admin-actions-inquiries';
import InquiryReplyForm from './InquiryReplyForm';

interface InquiryDetailProps {
  inquiry: Inquiry;
}

export default function InquiryDetail({ inquiry }: InquiryDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(inquiry.notes || '');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emails, setEmails] = useState<InquiryEmail[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load templates and emails when expanding
  useEffect(() => {
    const loadData = async () => {
      const [templatesData, inquiryData] = await Promise.all([
        getTemplatesForReplyAction(),
        getInquiryAction(inquiry.id),
      ]);
      setTemplates(templatesData);
      if (inquiryData.inquiry) {
        setEmails(inquiryData.inquiry.emails || []);
      }
    };
    loadData();

    // Mark as read if unread
    if (inquiry.status === 'unread') {
      startTransition(async () => {
        await updateInquiryStatusAction(inquiry.id, 'read');
      });
    }
  }, [inquiry.id, inquiry.status]);

  const handleStatusChange = (newStatus: Inquiry['status']) => {
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, newStatus);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Status updated' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      const result = await updateInquiryNotesAction(inquiry.id, notes);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Notes saved' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleReplySent = () => {
    setShowReplyForm(false);
    setMessage({ type: 'success', text: 'Reply sent!' });
    // Reload emails
    getInquiryAction(inquiry.id).then(({ inquiry: updated }) => {
      if (updated) setEmails(updated.emails || []);
    });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="inquiry-detail">
      {/* Message Banner */}
      {message && (
        <div className={`inquiry-message inquiry-message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Full Message */}
      <div className="inquiry-detail__section">
        <h4 className="inquiry-detail__label">Message</h4>
        <div className="inquiry-detail__message">
          {inquiry.message || <span className="text-muted">No message provided</span>}
        </div>
      </div>

      {/* Details Grid */}
      <div className="inquiry-detail__grid">
        {inquiry.phone && (
          <div>
            <span className="inquiry-detail__label">Phone</span>
            <span>{inquiry.phone}</span>
          </div>
        )}
        {inquiry.design_id && (
          <div>
            <span className="inquiry-detail__label">Design</span>
            <span>#{inquiry.design_id}</span>
          </div>
        )}
        {inquiry.placement && (
          <div>
            <span className="inquiry-detail__label">Placement</span>
            <span>{inquiry.placement}</span>
          </div>
        )}
        {inquiry.budget && (
          <div>
            <span className="inquiry-detail__label">Budget</span>
            <span>{inquiry.budget}</span>
          </div>
        )}
        <div>
          <span className="inquiry-detail__label">Received</span>
          <span>{new Date(inquiry.created_at).toLocaleString()}</span>
        </div>
        {inquiry.replied_at && (
          <div>
            <span className="inquiry-detail__label">Last Reply</span>
            <span>{new Date(inquiry.replied_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Status Actions */}
      <div className="inquiry-detail__section">
        <h4 className="inquiry-detail__label">Status</h4>
        <div className="inquiry-detail__actions">
          <button
            type="button"
            className={`btn btn--sm ${inquiry.status === 'booked' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => handleStatusChange('booked')}
            disabled={isPending}
          >
            ✓ Booked
          </button>
          <button
            type="button"
            className={`btn btn--sm ${inquiry.status === 'archived' ? 'btn--secondary' : 'btn--outline'}`}
            onClick={() => handleStatusChange('archived')}
            disabled={isPending}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="inquiry-detail__section">
        <h4 className="inquiry-detail__label">Internal Notes</h4>
        <textarea
          className="inquiry-detail__notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add private notes about this client..."
          rows={3}
        />
        <button
          type="button"
          className="btn btn--sm btn--outline mt-2"
          onClick={handleSaveNotes}
          disabled={isPending}
        >
          Save Notes
        </button>
      </div>

      {/* Conversation History */}
      {emails.length > 0 && (
        <div className="inquiry-detail__section">
          <h4 className="inquiry-detail__label">Conversation History</h4>
          <div className="inquiry-emails">
            {emails.map((email) => (
              <div key={email.id} className="inquiry-email">
                <div className="inquiry-email__header">
                  <span className="inquiry-email__subject">{email.subject}</span>
                  <span className="inquiry-email__time text-muted">
                    {new Date(email.sent_at).toLocaleString()}
                  </span>
                </div>
                <div className="inquiry-email__body">{email.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Section */}
      <div className="inquiry-detail__section">
        {showReplyForm ? (
          <InquiryReplyForm
            inquiry={inquiry}
            templates={templates}
            onCancel={() => setShowReplyForm(false)}
            onSent={handleReplySent}
          />
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowReplyForm(true)}
          >
            ✉️ Reply
          </button>
        )}
      </div>
    </div>
  );
}
