"use client";

import { useCallback, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { GalleryItem, GalleryCategory } from '../lib/gallery-types';
import { GALLERY_CATEGORIES, getCategoryLabel } from '../lib/gallery-types';
import Gallery from './Gallery';
import SmartImage from './SmartImage';

type GalleryViewProps = {
  readonly initialCategory: GalleryCategory;
  readonly initialItems: GalleryItem[];
};

type GalleryRecord = Partial<Record<GalleryCategory, GalleryItem[]>>;

export default function GalleryView({ initialCategory, initialItems }: GalleryViewProps) {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>(initialCategory);
  const [itemsByCategory, setItemsByCategory] = useState<GalleryRecord>({ [initialCategory]: initialItems });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const items = useMemo(() => itemsByCategory[activeCategory] ?? [], [activeCategory, itemsByCategory]);

  const fetchCategory = useCallback(async (category: GalleryCategory) => {
    if (itemsByCategory[category]) {
      setActiveCategory(category);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/gallery?category=${category}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Could not load ${category} artwork.`);
      }
      const payload = (await res.json()) as { items: GalleryItem[] };
      setItemsByCategory((prev) => ({ ...prev, [category]: payload.items }));
      setActiveCategory(category);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load gallery.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [itemsByCategory]);

  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <div className="gallery-view">
      <div className="gallery-filters" role="tablist" aria-label="Gallery categories">
        {GALLERY_CATEGORIES.map((category) => {
          const label = getCategoryLabel(category);
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`gallery-filter ${isActive ? 'gallery-filter--active' : ''}`}
              onClick={() => fetchCategory(category)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && <div className="gallery-error" role="alert">{error}</div>}

      <Gallery items={items} loading={loading} onSelect={setSelected} />

      {selected && (
        <dialog
          className="gallery-modal"
          open
          aria-label={selected.alt ?? 'Artwork preview'}
          onCancel={(event: SyntheticEvent<HTMLDialogElement>) => {
            event.preventDefault();
            closeModal();
          }}
          onClose={closeModal}
        >
          <div className="gallery-modal__content">
            <button className="gallery-modal__close" type="button" onClick={closeModal} aria-label="Close image preview">✕</button>
            <div className="gallery-modal__image">
              <SmartImage
                src={selected.src}
                alt={selected.alt ?? 'Tattoo artwork'}
                fill
                sizes="(min-width: 1024px) 70vw, 90vw"
                className="gallery-modal__img"
              />
            </div>
            {(selected.caption || selected.alt) && (
              <p className="gallery-modal__caption">{selected.caption || selected.alt}</p>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
