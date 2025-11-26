'use client';

interface DeleteButtonProps {
  category: string;
  itemKey: string | null;
  canMutate: boolean;
  className?: string;
}

export default function DeleteButton({ category, itemKey, canMutate, iconOnly = false, className }: DeleteButtonProps & { iconOnly?: boolean }) {
  const handleDelete = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent click from bubbling to parent link
    alert('Delete not yet implemented.');
  };

  // Small X overlay style - no btn classes, just the overlay class
  const isOverlay = className?.includes('admin-gallery__delete-x');

  if (isOverlay) {
    return (
      <form onSubmit={handleDelete} onClick={(e) => e.stopPropagation()} className={className}>
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="key" value={itemKey ?? ''} />
        <button
          type="submit"
          disabled={!canMutate || !itemKey}
          title="Delete"
          aria-label="Delete"
          onClick={handleDelete}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l8 8M9 1l-8 8" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleDelete} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="key" value={itemKey ?? ''} />
      <button
        className={`btn btn--danger admin-gallery__action${className ? ` ${className}` : ''}`}
        type="submit"
        disabled={!canMutate || !itemKey}
        title="Delete"
        aria-label="Delete"
        onClick={handleDelete}
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 7v7a2 2 0 002 2h4a2 2 0 002-2V7m-9 0h10m-9 0V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        {!iconOnly && <span>Delete</span>}
      </button>
    </form>
  );
}
