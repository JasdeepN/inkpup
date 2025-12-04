'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import type { Inquiry, EmailTemplate, InquiryEmail } from '@/lib/schemas/inquiry';
import type { Customer } from '@/lib/schemas/customer';
import {
  updateInquiryStatusAction,
  updateInquiryNotesAction,
  getTemplatesForReplyAction,
  sendReplyAction,
  getInquiryAction,
  createCustomerFromInquiryAction,
  getCustomerForInquiryAction,
  saveUnifiedNotesAction,
} from '@/lib/admin-actions-inquiries';
import { useInquiryWebSocket } from '@/lib/hooks/useInquiryWebSocket';
import InquiryReplyForm from './InquiryReplyForm';
import ConfirmDialog from './ConfirmDialog';

interface InquiryDetailProps {
  inquiry: Inquiry;
  /** Callback when status changes (for parent sync) */
  onStatusChange?: (status: Inquiry['status']) => void;
  /** Callback to mark as read on any action (deferred read-marking) */
  onActionTaken?: () => Promise<unknown>;
}

export default function InquiryDetail({ 
  inquiry, 
  onStatusChange,
  onActionTaken,
}: InquiryDetailProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(inquiry.notes || '');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emails, setEmails] = useState<InquiryEmail[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentStatus, setCurrentStatus] = useState(inquiry.status);

  // Realtime updates via WebSocket (no polling)
  useInquiryWebSocket(inquiry.id, {
    onMessage: (msg) => {
      if (msg.type === 'email_received' && Number(msg.inquiryId) === inquiry.id) {
        // Refresh conversation when a new email arrives
        handleRefreshConversation();
        // Sync status to pending to indicate new customer activity
        if (currentStatus !== 'pending') {
          setCurrentStatus('pending');
          onStatusChange?.('pending');
        }
      }
    },
  });

  // Load templates, emails, and customer on mount (NO auto-mark-read)
  useEffect(() => {
    const loadData = async () => {
      const [templatesData, inquiryData, customerData] = await Promise.all([
        getTemplatesForReplyAction(),
        getInquiryAction(inquiry.id),
        getCustomerForInquiryAction(inquiry.id),
      ]);
      setTemplates(templatesData);
      if (inquiryData.inquiry) {
        setEmails(inquiryData.inquiry.emails || []);
        // Sync status from server
        if (inquiryData.inquiry.status !== currentStatus) {
          setCurrentStatus(inquiryData.inquiry.status);
        }
      }
      if (customerData.customer) {
        setCustomer(customerData.customer);
        // Use customer notes if available (unified notes)
        if (customerData.customer.notes) {
          setNotes(customerData.customer.notes);
        }
      }
    };
    loadData();
  }, [inquiry.id, currentStatus]);

  // Manual refresh function for conversation
  const handleRefreshConversation = useCallback(() => {
    startTransition(async () => {
      const { inquiry: updated } = await getInquiryAction(inquiry.id);
      if (updated?.emails) {
        setEmails(updated.emails);
        setMessage({ type: 'success', text: 'Conversation refreshed' });
        setTimeout(() => setMessage(null), 2000);
        
        // Sync status if changed
        if (updated.status !== currentStatus) {
          setCurrentStatus(updated.status);
          onStatusChange?.(updated.status);
        }
      }
    });
  }, [inquiry.id, currentStatus, onStatusChange]);

  const handleStatusChange = (newStatus: Inquiry['status']) => {
    startTransition(async () => {
      // Mark as read on any status change (deferred read-marking)
      if (onActionTaken) await onActionTaken();
      
      const result = await updateInquiryStatusAction(inquiry.id, newStatus);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Status updated' });
        setCurrentStatus(newStatus);
        onStatusChange?.(newStatus);
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleCreateCustomer = () => {
    startTransition(async () => {
      if (onActionTaken) await onActionTaken();
      
      const result = await createCustomerFromInquiryAction(inquiry.id);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else if (result.customer) {
        setMessage({ type: 'success', text: 'Customer profile created!' });
        setCustomer(result.customer);
        setCurrentStatus('customer_created');
        onStatusChange?.('customer_created');
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleArchiveClick = () => {
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = () => {
    setShowArchiveConfirm(false);
    handleStatusChange('archived');
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      // Mark as read on save notes (deferred read-marking)
      if (onActionTaken) await onActionTaken();
      
      // Use unified notes - saves to customer if linked, otherwise to inquiry
      const result = await saveUnifiedNotesAction(inquiry.id, notes);
      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Notes saved' });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
        // Update customer state with new notes if linked
        if (customer) {
          setCustomer({ ...customer, notes });
        }
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleReplySent = () => {
    setShowReplyForm(false);
    setMessage({ type: 'success', text: 'Reply sent!' });
    
    // Mark as read on reply (deferred read-marking)
    if (onActionTaken) onActionTaken();
    
    // Reload emails
    getInquiryAction(inquiry.id).then(({ inquiry: updated }) => {
      if (updated) setEmails(updated.emails || []);
    });
    
    // Notify parent of status change to 'replied'
    onStatusChange?.('replied');
    
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

      {/* Customer Profile Section */}
      <div className="inquiry-detail__section">
        <h4 className="inquiry-detail__label">Customer Profile</h4>
        {customer ? (
          <div className="customer-summary">
            <div className="customer-summary__info">
              <span className="customer-summary__name">{customer.name}</span>
              <span className="customer-summary__email">{customer.email}</span>
              {customer.phone && (
                <span className="customer-summary__phone">{customer.phone}</span>
              )}
            </div>
            <div className="customer-summary__stats">
              <span className="customer-summary__deposits">
                💰 ${(customer.total_deposits || 0).toFixed(2)} total deposits
              </span>
            </div>
            <Link 
              href={`/dashboard/customers/${customer.id}`}
              className="btn btn--sm btn--outline"
            >
              View Customer →
            </Link>
          </div>
        ) : (
          <div className="customer-create">
            <p className="customer-create__hint">
              Create a customer profile to track deposits and manage bookings.
            </p>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={handleCreateCustomer}
              disabled={isPending}
            >
              {isPending ? 'Creating...' : '👤 Create Customer Profile'}
            </button>
          </div>
        )}
      </div>

      {/* Status Progression */}
      <div className="inquiry-detail__section">
        <h4 className="inquiry-detail__label">Status</h4>
        <StatusProgression 
          currentStatus={currentStatus}
          hasCustomer={!!customer}
          onStatusChange={handleStatusChange}
          onArchiveClick={handleArchiveClick}
          isPending={isPending}
        />
      </div>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={showArchiveConfirm}
        title="📦 Archive Inquiry"
        message={`Are you sure you want to archive this inquiry from ${inquiry.name}? You can unarchive it later from the Archived tab.`}
        confirmText="Archive"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveConfirm(false)}
      />

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
          className={`btn btn--sm inquiry-detail__save-notes mt-2 ${notesSaved ? 'inquiry-detail__save-notes--saved' : ''}`}
          onClick={handleSaveNotes}
          disabled={isPending}
        >
          {notesSaved ? '✓ Saved!' : '💾 Save Notes'}
        </button>
      </div>

      {/* Conversation History */}
      {emails.length > 0 && (
        <div className="inquiry-detail__section">
          <div className="inquiry-detail__section-header">
            <h4 className="inquiry-detail__label">Conversation History</h4>
            <button
              type="button"
              className="btn btn--sm btn--outline"
              onClick={handleRefreshConversation}
              disabled={isPending}
              title="Check for new messages"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="inquiry-emails">
            {emails.map((email) => {
              const isInbound = email.direction === 'inbound';
              return (
                <div
                  key={email.id}
                  className={`inquiry-email ${isInbound ? 'inquiry-email--inbound' : 'inquiry-email--outbound'}`}
                >
                  <div className="inquiry-email__header">
                    <span className="inquiry-email__direction">
                      {isInbound ? '📥 Customer' : '📤 You'}
                    </span>
                    <span className="inquiry-email__subject">{email.subject}</span>
                    <span className="inquiry-email__time text-muted">
                      {new Date(email.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="inquiry-email__body">{email.body}</div>
                </div>
              );
            })}
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

/**
 * Status Progression Component
 * Shows the workflow: Customer Created → Deposit → Design → Booked → Archive
 * Previous stages stay highlighted, can't skip stages (except archive)
 */
interface StatusProgressionProps {
  currentStatus: Inquiry['status'];
  hasCustomer: boolean;
  onStatusChange: (status: Inquiry['status']) => void;
  onArchiveClick: () => void;
  isPending: boolean;
}

function StatusProgression({ 
  currentStatus,
  hasCustomer,
  onStatusChange, 
  onArchiveClick,
  isPending 
}: StatusProgressionProps) {
  // Define the progression order: customer_created → deposit_received → design → booked
  type Stage = 'customer_created' | 'deposit_received' | 'design' | 'booked';
  const stages: Stage[] = ['customer_created', 'deposit_received', 'design', 'booked'];
  
  // Get numeric level for current status
  const getStatusLevel = (status: string): number => {
    if (status === 'archived') return 999; // Special case
    if (status === 'booked') return 4;
    if (status === 'design') return 3;
    if (status === 'deposit_received') return 2;
    if (status === 'customer_created') return 1;
    return 0; // read, replied, unread
  };
  
  const currentLevel = getStatusLevel(currentStatus);
  const isArchived = currentStatus === 'archived';
  
  // Check if a stage is completed (at or past this stage)
  const isStageCompleted = (stage: Stage): boolean => {
    const stageLevel = getStatusLevel(stage);
    return currentLevel >= stageLevel;
  };
  
  // Check if a stage can be clicked
  const canClickStage = (stage: Stage): boolean => {
    if (isArchived) return false;
    if (isPending) return false;
    
    const stageLevel = getStatusLevel(stage);
    
    // Customer created requires having a customer
    if (stage === 'customer_created' && !hasCustomer) return false;
    
    // Can click if it's the current stage (to go back) or the next available stage
    // But must have completed previous stages
    if (stage === 'deposit_received' && !isStageCompleted('customer_created')) return false;
    if (stage === 'design' && !isStageCompleted('deposit_received')) return false;
    if (stage === 'booked' && !isStageCompleted('design')) return false;
    
    return stageLevel <= currentLevel + 1;
  };

  const handleStageClick = (stage: Stage) => {
    if (!canClickStage(stage)) return;
    
    const stageLevel = getStatusLevel(stage);
    
    // If clicking current stage, go back to previous
    if (stageLevel === currentLevel) {
      const currentIndex = stages.indexOf(stage);
      if (currentIndex > 0) {
        onStatusChange(stages[currentIndex - 1]);
      } else {
        onStatusChange('read');
      }
    } else {
      // Moving forward
      onStatusChange(stage);
    }
  };

  const stageLabels: Record<Stage, { icon: string; label: string }> = {
    customer_created: { icon: '👤', label: 'Customer Created' },
    deposit_received: { icon: '💰', label: 'Deposit Received' },
    design: { icon: '🎨', label: 'Design Phase' },
    booked: { icon: '✓', label: 'Booked' },
  };

  const getStageTitle = (stage: Stage): string => {
    if (isArchived) return 'Inquiry archived';
    if (!canClickStage(stage)) {
      if (stage === 'customer_created' && !hasCustomer) {
        return 'Create customer profile first';
      }
      const prevStage = stages[stages.indexOf(stage) - 1];
      if (prevStage) {
        return `Complete "${stageLabels[prevStage].label}" first`;
      }
    }
    if (isStageCompleted(stage)) {
      return `${stageLabels[stage].label} ✓`;
    }
    return `Mark as ${stageLabels[stage].label}`;
  };

  return (
    <div className="status-progression">
      <div className="status-progression__stages">
        {stages.map((stage, index) => (
          <div key={stage} className="status-progression__stage-wrapper">
            {index > 0 && <span className="status-progression__arrow">→</span>}
            <button
              type="button"
              className={`status-progression__stage ${
                isStageCompleted(stage) ? 'status-progression__stage--completed' : ''
              } ${currentStatus === stage ? 'status-progression__stage--current' : ''} ${
                !canClickStage(stage) ? 'status-progression__stage--disabled' : ''
              }`}
              onClick={() => handleStageClick(stage)}
              disabled={isPending || isArchived || !canClickStage(stage)}
              title={getStageTitle(stage)}
            >
              {stageLabels[stage].icon} {stageLabels[stage].label}
            </button>
          </div>
        ))}
        
        {/* Archive - always available */}
        <span className="status-progression__arrow">→</span>
        <button
          type="button"
          className={`status-progression__stage status-progression__stage--archive ${
            isArchived ? 'status-progression__stage--completed' : ''
          }`}
          onClick={onArchiveClick}
          disabled={isPending}
          title={isArchived ? 'Archived' : 'Archive inquiry'}
        >
          Archive
        </button>
      </div>

      {/* Helper text */}
      {!isArchived && currentLevel === 0 && !hasCustomer && (
        <p className="status-progression__hint">
          Create a customer profile to start tracking progress
        </p>
      )}
      {!isArchived && hasCustomer && currentLevel < 1 && (
        <p className="status-progression__hint">
          Click &quot;Customer Created&quot; to confirm the profile
        </p>
      )}
    </div>
  );
}
