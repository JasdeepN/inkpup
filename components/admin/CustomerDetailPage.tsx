'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import type { CustomerWithDepositsAndInquiries, Deposit } from '@/lib/schemas/customer';
import type { Inquiry } from '@/lib/schemas/inquiry';
import {
  updateCustomerNotesAction,
  deleteCustomerAction,
} from '@/lib/admin-actions-customers';
import {
  markDepositReceivedAction,
  markDepositRefundedAction,
  deleteDepositAction,
} from '@/lib/admin-actions-deposits';
import ConfirmDialog from './ConfirmDialog';
import AddDepositForm from './AddDepositForm';

interface CustomerDetailPageProps {
  customer: CustomerWithDepositsAndInquiries;
}

export default function CustomerDetailPage({ customer: initialCustomer }: CustomerDetailPageProps) {
  const [isPending, startTransition] = useTransition();
  const [customer, setCustomer] = useState(initialCustomer);
  const [notes, setNotes] = useState(customer.notes || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDeposit, setShowAddDeposit] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<number | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleSaveNotes = useCallback(() => {
    startTransition(async () => {
      const result = await updateCustomerNotesAction(customer.id, notes);
      if (result?.error) {
        showMessage('error', result.error);
      } else {
        showMessage('success', 'Notes saved');
      }
    });
  }, [customer.id, notes, showMessage]);

  const handleDeleteCustomer = useCallback(() => {
    startTransition(async () => {
      const result = await deleteCustomerAction(customer.id);
      if (result?.error) {
        showMessage('error', result.error);
        setShowDeleteConfirm(false);
      } else {
        // Redirect to customers list
        window.location.href = '/dashboard/customers';
      }
    });
  }, [customer.id, showMessage]);

  const handleMarkReceived = useCallback((depositId: number) => {
    startTransition(async () => {
      const result = await markDepositReceivedAction(depositId);
      if (result?.error) {
        showMessage('error', result.error);
      } else {
        showMessage('success', 'Deposit marked as received');
        // Update local state
        setCustomer(prev => ({
          ...prev,
          deposits: prev.deposits.map(d =>
            d.id === depositId
              ? { ...d, status: 'received' as const, received_at: new Date().toISOString() }
              : d
          ),
          total_deposits: prev.total_deposits + (prev.deposits.find(d => d.id === depositId)?.amount || 0),
        }));
      }
    });
  }, [showMessage]);

  const handleMarkRefunded = useCallback((depositId: number) => {
    startTransition(async () => {
      const result = await markDepositRefundedAction(depositId);
      if (result?.error) {
        showMessage('error', result.error);
      } else {
        showMessage('success', 'Deposit marked as refunded');
        // Update local state
        const deposit = customer.deposits.find(d => d.id === depositId);
        setCustomer(prev => ({
          ...prev,
          deposits: prev.deposits.map(d =>
            d.id === depositId ? { ...d, status: 'refunded' as const } : d
          ),
          total_deposits: deposit?.status === 'received'
            ? prev.total_deposits - (deposit?.amount || 0)
            : prev.total_deposits,
        }));
      }
    });
  }, [customer.deposits, showMessage]);

  const handleDeleteDeposit = useCallback((depositId: number) => {
    startTransition(async () => {
      const result = await deleteDepositAction(depositId);
      if (result?.error) {
        showMessage('error', result.error);
      } else {
        showMessage('success', 'Deposit deleted');
        const deposit = customer.deposits.find(d => d.id === depositId);
        setCustomer(prev => ({
          ...prev,
          deposits: prev.deposits.filter(d => d.id !== depositId),
          total_deposits: deposit?.status === 'received'
            ? prev.total_deposits - (deposit?.amount || 0)
            : prev.total_deposits,
        }));
      }
      setDepositToDelete(null);
    });
  }, [customer.deposits, showMessage]);

  const handleDepositAdded = useCallback((deposit: Deposit) => {
    setCustomer(prev => ({
      ...prev,
      deposits: [deposit, ...prev.deposits],
      total_deposits: deposit.status === 'received'
        ? prev.total_deposits + deposit.amount
        : prev.total_deposits,
    }));
    setShowAddDeposit(false);
    showMessage('success', 'Deposit recorded');
  }, [showMessage]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="admin-shell">
      <div className="customer-detail-page admin-card">
        {/* Header */}
        <div className="customer-detail-page__header">
          <Link href="/dashboard/customers" className="customer-detail-page__back">
            ← Back to customers
          </Link>
          <div className="customer-detail-page__actions">
            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`inquiry-message inquiry-message--${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Customer Info */}
        <div className="customer-detail-page__info mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              <p className="text-muted">
                {customer.email}
                {customer.phone && ` · ${customer.phone}`}
              </p>
            </div>
            <div className="text-right">
              <div className="customer-stat--large">
                💰 {formatCurrency(customer.total_deposits)}
              </div>
              <p className="text-muted text-sm">
                Customer since {formatDate(customer.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="customer-detail__section">
          <h4 className="customer-detail__label">Internal Notes</h4>
          <textarea
            className="customer-detail__notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add private notes about this customer..."
            rows={3}
          />
          <button
            type="button"
            className="btn btn--sm customer-detail__save-notes mt-2"
            onClick={handleSaveNotes}
            disabled={isPending}
          >
            💾 Save Notes
          </button>
        </div>

        {/* Deposits */}
        <div className="customer-detail__section">
          <div className="flex items-center justify-between mb-4">
            <h4 className="customer-detail__label">Deposits</h4>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => setShowAddDeposit(true)}
            >
              + Add Deposit
            </button>
          </div>

          {showAddDeposit && (
            <AddDepositForm
              customerId={customer.id}
              onSuccess={handleDepositAdded}
              onCancel={() => setShowAddDeposit(false)}
            />
          )}

          {customer.deposits.length === 0 ? (
            <div className="customer-empty--small">
              <p className="text-muted">No deposits recorded yet</p>
            </div>
          ) : (
            <div className="deposit-list">
              {customer.deposits.map((deposit) => (
                <DepositListItem
                  key={deposit.id}
                  deposit={deposit}
                  onMarkReceived={() => handleMarkReceived(deposit.id)}
                  onMarkRefunded={() => handleMarkRefunded(deposit.id)}
                  onDelete={() => setDepositToDelete(deposit.id)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inquiries / Messages */}
        <div className="customer-detail__section">
          <h4 className="customer-detail__label">Messages</h4>
          
          {customer.inquiries.length === 0 ? (
            <div className="customer-empty--small">
              <p className="text-muted">No inquiries linked to this customer</p>
            </div>
          ) : (
            <div className="inquiry-message-list">
              {customer.inquiries.map((inquiry) => (
                <InquiryMessageItem key={inquiry.id} inquiry={inquiry} />
              ))}
            </div>
          )}
        </div>

        {/* Delete Customer Confirmation */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="🗑️ Delete Customer"
          message={`Are you sure you want to delete ${customer.name}? This will also delete all their deposit records. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleDeleteCustomer}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Delete Deposit Confirmation */}
        <ConfirmDialog
          open={depositToDelete !== null}
          title="🗑️ Delete Deposit"
          message="Are you sure you want to delete this deposit record?"
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={() => depositToDelete && handleDeleteDeposit(depositToDelete)}
          onCancel={() => setDepositToDelete(null)}
        />
      </div>
    </div>
  );
}

interface DepositListItemProps {
  deposit: Deposit;
  onMarkReceived: () => void;
  onMarkRefunded: () => void;
  onDelete: () => void;
  isPending: boolean;
}

function DepositListItem({
  deposit,
  onMarkReceived,
  onMarkRefunded,
  onDelete,
  isPending,
}: DepositListItemProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadge = {
    pending: { label: 'Pending', class: 'deposit-status--pending' },
    received: { label: 'Received', class: 'deposit-status--received' },
    refunded: { label: 'Refunded', class: 'deposit-status--refunded' },
  }[deposit.status];

  const methodLabel = {
    'e-transfer': 'E-Transfer',
    'cash': 'Cash',
    'credit': 'Credit Card',
    'other': 'Other',
  }[deposit.method];

  return (
    <div className="deposit-item">
      <div className="deposit-item__main">
        <div className="deposit-item__amount">{formatCurrency(deposit.amount)}</div>
        <div className="deposit-item__details">
          <span className={`deposit-status ${statusBadge.class}`}>
            {statusBadge.label}
          </span>
          <span className="deposit-item__method">{methodLabel}</span>
          <span className="deposit-item__date">{formatDate(deposit.created_at)}</span>
          {deposit.reference && (
            <span className="deposit-item__reference">Ref: {deposit.reference}</span>
          )}
        </div>
        {deposit.notes && (
          <div className="deposit-item__notes">{deposit.notes}</div>
        )}
      </div>
      <div className="deposit-item__actions">
        {deposit.status === 'pending' && (
          <button
            type="button"
            className="btn btn--sm btn--success"
            onClick={onMarkReceived}
            disabled={isPending}
            title="Mark as received"
          >
            ✓
          </button>
        )}
        {deposit.status === 'received' && (
          <button
            type="button"
            className="btn btn--sm btn--warning"
            onClick={onMarkRefunded}
            disabled={isPending}
            title="Mark as refunded"
          >
            ↩
          </button>
        )}
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={onDelete}
          disabled={isPending}
          title="Delete deposit"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function InquiryMessageItem({ inquiry }: { inquiry: Inquiry }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const typeEmoji = {
    flash: '🎨',
    custom: '✨',
    contact: '💬',
  }[inquiry.inquiry_type] || '💬';

  const typeLabel = {
    flash: 'Flash Design',
    custom: 'Custom Request',
    contact: 'General',
  }[inquiry.inquiry_type] || 'Inquiry';

  return (
    <Link 
      href={`/dashboard/inquiries/${inquiry.id}`}
      className="inquiry-message-item"
    >
      <div className="inquiry-message-item__header">
        <span className="inquiry-message-item__type">
          {typeEmoji} {typeLabel}
        </span>
        <span className="inquiry-message-item__date">
          {formatDate(inquiry.created_at)}
        </span>
      </div>
      {inquiry.message && (
        <p className="inquiry-message-item__text">
          {inquiry.message.length > 150 
            ? inquiry.message.slice(0, 150) + '…' 
            : inquiry.message}
        </p>
      )}
      {inquiry.design_id && (
        <span className="inquiry-message-item__design">
          Design #{inquiry.design_id}
        </span>
      )}
      {inquiry.placement && (
        <span className="inquiry-message-item__placement">
          📍 {inquiry.placement}
        </span>
      )}
    </Link>
  );
}
