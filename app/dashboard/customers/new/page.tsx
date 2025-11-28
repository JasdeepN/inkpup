'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { createCustomerAction } from '@/lib/admin-actions-customers';

export default function NewCustomerPage() {
  const [state, formAction, isPending] = useActionState(createCustomerAction, null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Handle success - redirect after a moment
  if (state?.success && !formSubmitted) {
    setFormSubmitted(true);
    setTimeout(() => {
      window.location.href = '/dashboard/customers';
    }, 1000);
  }

  return (
    <div className="admin-shell">
      <div className="admin-card" style={{ maxWidth: '600px' }}>
        <div className="customer-detail-page__header">
          <Link href="/dashboard/customers" className="customer-detail-page__back">
            ← Back to customers
          </Link>
        </div>

        <h1 className="text-xl font-bold mb-6">Add New Customer</h1>

        {state?.success && (
          <div className="inquiry-message inquiry-message--success mb-4">
            {state.success} Redirecting...
          </div>
        )}

        {state?.error && (
          <div className="inquiry-message inquiry-message--error mb-4">
            {state.error}
          </div>
        )}

        <form action={formAction} className="customer-form">
          <div className="customer-form__field">
            <label htmlFor="email" className="customer-form__label">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="customer-form__input"
              placeholder="customer@example.com"
              required
            />
            {state?.fieldErrors?.email && (
              <div className="customer-form__error">{state.fieldErrors.email[0]}</div>
            )}
          </div>

          <div className="customer-form__field">
            <label htmlFor="name" className="customer-form__label">
              Name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="customer-form__input"
              placeholder="John Doe"
              required
            />
            {state?.fieldErrors?.name && (
              <div className="customer-form__error">{state.fieldErrors.name[0]}</div>
            )}
          </div>

          <div className="customer-form__field">
            <label htmlFor="phone" className="customer-form__label">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="customer-form__input"
              placeholder="555-123-4567"
            />
          </div>

          <div className="customer-form__field">
            <label htmlFor="notes" className="customer-form__label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              className="customer-form__textarea"
              placeholder="Internal notes about this customer..."
              rows={3}
            />
          </div>

          <div className="customer-form__actions">
            <Link href="/dashboard/customers" className="btn btn--outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isPending || formSubmitted}
            >
              {isPending ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
