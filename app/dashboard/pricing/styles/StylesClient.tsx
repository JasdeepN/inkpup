'use client';

import { useActionState, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createStyleAction,
  updateStyleAction,
  deleteStyleAction,
  type ActionState,
} from '../../../../lib/admin-actions-pricing';
import type { Style, ColorProfile } from '../../../../types/cloudflare';

interface StyleFormProps {
  style?: Style;
  colorProfiles: ColorProfile[];
  onCancel?: () => void;
  onSuccess?: () => void;
}

function StyleForm({ style, colorProfiles, onCancel, onSuccess }: StyleFormProps) {
  const isEdit = !!style;
  const action = isEdit ? updateStyleAction : createStyleAction;
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

      {isEdit && <input type="hidden" name="id" value={style.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="id" className="block text-sm font-medium mb-1">
            ID {!isEdit && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            id="id"
            name="id"
            defaultValue={style?.id ?? ''}
            disabled={isEdit}
            required={!isEdit}
            placeholder="e.g., traditional"
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
            defaultValue={style?.label ?? ''}
            required
            placeholder="e.g., Traditional"
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
            defaultValue={style?.multiplier ?? 1}
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
            defaultValue={style?.sort_order ?? 0}
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
            defaultValue={style?.description ?? ''}
            rows={2}
            placeholder="Optional description of this style"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="recommended_color_type" className="block text-sm font-medium mb-1">
            Recommended Color Type
          </label>
          <select
            id="recommended_color_type"
            name="recommended_color_type"
            defaultValue={style?.recommended_color_type ?? ''}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">None</option>
            {colorProfiles.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Style' : 'Create Style'}
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
  styleId: string;
}

function DeleteButton({ styleId }: DeleteButtonProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(deleteStyleAction, null);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={styleId} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this style?')) {
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

interface StylesClientProps {
  initialStyles: Style[];
  colorProfiles: ColorProfile[];
}

export default function StylesClient({ initialStyles, colorProfiles }: StylesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [styles, setStyles] = useState(initialStyles);

  // Sync with server data when initialStyles changes (after router.refresh)
  useEffect(() => {
    setStyles(initialStyles);
  }, [initialStyles]);

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
        <h2 className="text-xl font-semibold">Tattoo Styles</h2>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
          >
            Add Style
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="admin-card p-4">
          <h3 className="text-lg font-medium mb-4">Create New Style</h3>
          <StyleForm colorProfiles={colorProfiles} onCancel={() => setShowCreateForm(false)} onSuccess={handleCreateSuccess} />
        </div>
      )}

      {styles.length === 0 ? (
        <div className="admin-card p-8 text-center text-gray-400">
          <p>No styles configured yet.</p>
          <p className="text-sm mt-2">Add your first style to get started.</p>
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
              {styles.map((style) => (
                <tr key={style.id}>
                  {editingId === style.id ? (
                    <td colSpan={5} className="p-4">
                      <StyleForm
                        style={style}
                        colorProfiles={colorProfiles}
                        onCancel={() => setEditingId(null)}
                        onSuccess={handleEditSuccess}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-sm">{style.id}</td>
                      <td className="px-4 py-3">{style.label}</td>
                      <td className="px-4 py-3">{style.multiplier}×</td>
                      <td className="px-4 py-3">{style.sort_order}</td>
                      <td className="px-4 py-3 text-right space-x-4">
                        <button
                          onClick={() => setEditingId(style.id)}
                          className="text-accent hover:text-accent/80 transition-colors"
                        >
                          Edit
                        </button>
                        <DeleteButton styleId={style.id} />
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
