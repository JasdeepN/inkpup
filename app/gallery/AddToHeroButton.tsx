'use client';

interface AddToHeroButtonProps {
  itemKey: string | null;
  disabled?: boolean;
  className?: string;
}

export default function AddToHeroButton({ itemKey, disabled, iconOnly = false, className }: AddToHeroButtonProps & { iconOnly?: boolean }) {
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Add to Hero not yet implemented.');
  };

  return (
    <form onSubmit={handleAdd}>
      <input type="hidden" name="key" value={itemKey ?? ''} />
      <button
        className={`btn btn--secondary admin-gallery__action${className ? ` ${className}` : ''}`}
        type="submit"
        disabled={disabled || !itemKey}
        title={disabled ? 'Already in Hero gallery' : 'Add to Hero gallery'}
        aria-label="Add to Hero"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"/>
        </svg>
        {!iconOnly && <span>Add to Hero</span>}
      </button>
    </form>
  );
}
