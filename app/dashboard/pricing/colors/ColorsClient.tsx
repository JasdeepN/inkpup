'use client';

import { useActionState, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createColorAction,
  updateColorAction,
  deleteColorAction,
  type ActionState,
} from '../../../../lib/admin-actions-pricing';
import type { ColorProfile } from '../../../../types/cloudflare';

interface ColorFormProps {
  color?: ColorProfile;
  onCancel?: () => void;
  onSuccess?: () => void;
}

function ColorForm({ color, onCancel, onSuccess }: ColorFormProps) {
  const isEdit = !!color;
  const action = isEdit ? updateColorAction : createColorAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, null);

  // Call onSuccess when form submission succeeds (must be in useEffect to avoid setState during render)
  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded">
          {state.error}
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={color.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="id" className="block text-sm font-medium mb-1">
            ID {!isEdit && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            id="id"
            name="id"
            defaultValue={color?.id ?? ''}
            disabled={isEdit}
            required={!isEdit}
            placeholder="e.g., full-color"
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
            defaultValue={color?.label ?? ''}
            required
            placeholder="e.g., Full Color"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {state?.fieldErrors?.label && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.label.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="multiplier" className="block text-sm font-medium mb-1">
            Multiplier <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="multiplier"
            name="multiplier"
            defaultValue={color?.multiplier ?? 1}
            required
            step="0.01"
            min="0.1"
            max="10"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {state?.fieldErrors?.multiplier && (
            <p className="text-red-400 text-sm mt-1">{state.fieldErrors.multiplier.join(', ')}</p>
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
            defaultValue={color?.sort_order ?? 0}
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
            defaultValue={color?.description ?? ''}
            rows={2}
            placeholder="Optional description of this color profile"
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
          {isPending ? 'Saving...' : isEdit ? 'Update Color' : 'Create Color'}
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
  colorId: string;
}

function DeleteButton({ colorId }: DeleteButtonProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(deleteColorAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={colorId} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this color profile?')) {
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

interface ColorsClientProps {
  initialColors: ColorProfile[];
}

export default function ColorsClient({ initialColors }: ColorsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colors, setColors] = useState(initialColors);

  // Sync with server data when initialColors changes (after router.refresh)
  useEffect(() => {
    setColors(initialColors);
  }, [initialColors]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleEditSuccess = () => {
    setEditingId(null);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Color Profiles</h2>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            Add Color
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="admin-card p-4">
          <h3 className="text-lg font-medium mb-4">Create New Color Profile</h3>
          <ColorForm onCancel={() => setShowCreateForm(false)} onSuccess={handleCreateSuccess} />
        </div>
      )}

      {colors.length === 0 ? (
        <div className="admin-card p-8 text-center text-gray-400">
          <p>No color profiles configured yet.</p>
          <p className="text-sm mt-2">Add your first color profile to get started.</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Label</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Multiplier</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sort Order</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {colors.map((color) => (
                <tr key={color.id}>
                  {editingId === color.id ? (
                    <td colSpan={5} className="p-4">
                      <ColorForm
                        color={color}
                        onCancel={() => setEditingId(null)}
                        onSuccess={handleEditSuccess}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-sm">{color.id}</td>
                      <td className="px-4 py-3">{color.label}</td>
                      <td className="px-4 py-3">{color.multiplier}×</td>
                      <td className="px-4 py-3">{color.sort_order}</td>
                      <td className="px-4 py-3 text-right space-x-4">
                        <button
                          onClick={() => setEditingId(color.id)}
                          className="text-accent hover:text-accent/80 transition-colors"
                        >
                          Edit
                        </button>
                        <DeleteButton colorId={color.id} />
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
