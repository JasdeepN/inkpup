'use client';

import { useState, useTransition } from 'react';
import type { Deposit, DepositMethod } from '@/lib/schemas/customer';
import { quickCreateDepositAction } from '@/lib/admin-actions-deposits';

interface AddDepositFormProps {
  customerId: number;
  inquiryId?: number;
  onSuccess: (deposit: Deposit) => void;
  onCancel: () => void;
}

export default function AddDepositForm({
  customerId,
  inquiryId,
  onSuccess,
  onCancel,
}: AddDepositFormProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DepositMethod>('e-transfer');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    startTransition(async () => {
      const result = await quickCreateDepositAction(customerId, amountNum, method, inquiryId);
      if (result.error) {
        setError(result.error);
      } else if (result.deposit) {
        onSuccess(result.deposit);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="add-deposit-form mb-4">
      <div className="add-deposit-form__row">
        <div className="add-deposit-form__field">
          <label htmlFor="amount" className="add-deposit-form__label">
            Amount
          </label>
          <div className="add-deposit-form__input-group">
            <span className="add-deposit-form__prefix">$</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="add-deposit-form__input"
              placeholder="0.00"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="add-deposit-form__field">
          <label htmlFor="method" className="add-deposit-form__label">
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as DepositMethod)}
            className="add-deposit-form__select"
          >
            <option value="e-transfer">E-Transfer</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit Card</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="add-deposit-form__error">{error}</div>
      )}

      <div className="add-deposit-form__actions">
        <button
          type="button"
          className="btn btn--sm btn--outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--sm btn--primary"
          disabled={isPending}
        >
          {isPending ? 'Adding...' : 'Add Deposit'}
        </button>
      </div>
    </form>
  );
}
