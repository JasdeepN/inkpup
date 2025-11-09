'use client';

interface DeleteButtonProps {
  category: string;
  itemKey: string | null;
  canMutate: boolean;
  className?: string;
}

export default function DeleteButton({ category, itemKey, canMutate, iconOnly = false, className }: DeleteButtonProps & { iconOnly?: boolean }) {
  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Delete not yet implemented.');
  };

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="key" value={itemKey ?? ''} />
      <button
        className={`btn btn--danger admin-gallery__action${className ? ` ${className}` : ''}`}
        type="submit"
        disabled={!canMutate || !itemKey}
        title="Delete"
        aria-label="Delete"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 7v7a2 2 0 002 2h4a2 2 0 002-2V7m-9 0h10m-9 0V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        {!iconOnly && <span>Delete</span>}
      </button>
    </form>
  );
}
