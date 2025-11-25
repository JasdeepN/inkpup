'use client';

import { useActionState, useState } from 'react';
import {
  createSizeAction,
  updateSizeAction,
  deleteSizeAction,
  type ActionState,
} from '../../../../lib/admin-actions-pricing';
import type { SizeCategory } from '../../../../types/cloudflare';

interface SizeFormProps {
  size?: SizeCategory;
  onCancel?: () => void;
  onSuccess?: () => void;
}

function SizeForm({ size, onCancel, onSuccess }: SizeFormProps) {
  const isEdit = !!size;
  const action = isEdit ? updateSizeAction : createSizeAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded">
          {state.error}
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={size.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="id" className="block text-sm font-medium mb-1">
            ID {!isEdit && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            id="id"
            name="id"
            defaultValue={size?.id ?? ''}
            disabled={isEdit}
            required={!isEdit}
            placeholder="e.g., small"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          {state?.fieldErrors?.id && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.id.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="label" className="block text-sm font-medium mb-1">
            Label <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="label"
            name="label"
            defaultValue={size?.label ?? ''}
            required
            placeholder="e.g., Small (2-4 inches)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {state?.fieldErrors?.label && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.label.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="min_price" className="block text-sm font-medium mb-1">
            Min Price ($) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="min_price"
            name="min_price"
            defaultValue={size?.min_price ?? 0}
            required
            min="0"
            max="100000"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {state?.fieldErrors?.min_price && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.min_price.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="max_price" className="block text-sm font-medium mb-1">
            Max Price ($) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="max_price"
            name="max_price"
            defaultValue={size?.max_price ?? 0}
            required
            min="0"
            max="100000"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {state?.fieldErrors?.max_price && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.max_price.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium mb-1">
            Sort Order
          </label>
          <input
            type="number"
            id="sort_order"
            name="sort_order"
            defaultValue={size?.sort_order ?? 0}
            min="0"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={size?.description ?? ''}
            rows={2}
            placeholder="Optional description of this size category"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Size' : 'Create Size'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

interface DeleteButtonProps {
  sizeId: string;
}

function DeleteButton({ sizeId }: DeleteButtonProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(deleteSizeAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={sizeId} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this size category?')) {
            e.preventDefault();
          }
        }}
        className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
      {state?.error && <span className="text-red-400 text-sm ml-2">{state.error}</span>}
    </form>
  );
}

interface SizesClientProps {
  initialSizes: SizeCategory[];
}

export default function SizesClient({ initialSizes }: SizesClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sizes, setSizes] = useState(initialSizes);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleEditSuccess = () => {
    setEditingId(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Size Categories</h2>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            Add Size
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="admin-card p-4">
          <h3 className="text-lg font-medium mb-4">Create New Size Category</h3>
          <SizeForm onCancel={() => setShowCreateForm(false)} onSuccess={handleCreateSuccess} />
        </div>
      )}

      {sizes.length === 0 ? (
        <div className="admin-card p-8 text-center text-gray-400">
          <p>No size categories configured yet.</p>
          <p className="text-sm mt-2">Add your first size category to get started.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Label</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Price Range</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sort Order</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sizes.map((size) => (
                <tr key={size.id}>
                  {editingId === size.id ? (
                    <td colSpan={5} className="p-4">
                      <SizeForm
                        size={size}
                        onCancel={() => setEditingId(null)}
                        onSuccess={handleEditSuccess}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-sm">{size.id}</td>
                      <td className="px-4 py-3">{size.label}</td>
                      <td className="px-4 py-3">
                        {formatPrice(size.min_price)} – {formatPrice(size.max_price)}
                      </td>
                      <td className="px-4 py-3">{size.sort_order}</td>
                      <td className="px-4 py-3 text-right space-x-4">
                        <button
                          onClick={() => setEditingId(size.id)}
                          className="text-accent hover:text-accent/80 transition-colors"
                        >
                          Edit
                        </button>
                        <DeleteButton sizeId={size.id} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
