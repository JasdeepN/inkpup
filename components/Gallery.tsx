"use client";

import { useMemo } from 'react';
import SmartImage from './SmartImage';
import type { GalleryItem } from '../lib/gallery-types';

type GalleryProps = {
  readonly items: GalleryItem[];
  readonly loading?: boolean;
  readonly onSelect?: (item: GalleryItem) => void;
};

const skeletonKeys = ['one', 'two', 'three', 'four', 'five', 'six'];

export default function Gallery({ items, loading = false, onSelect }: GalleryProps) {
  const content = useMemo(() => {
    if (loading && !items.length) {
      return skeletonKeys.map((key) => (
        <div key={`skeleton-${key}`} className="gallery-card gallery-card--skeleton" aria-hidden />
      ));
    }

    if (!items.length) {
      return <p className="gallery-empty">No artwork in this category yet. Check back soon.</p>;
    }

    return items.map((item, idx) => (
      <figure key={item.id ?? `${item.src}-${idx}`} className="gallery-card" data-e2e-id={`gallery-item-${idx}`}>
        <button
          type="button"
          className="gallery-card__inner"
          onClick={() => onSelect?.(item)}
          aria-label={`View ${item.alt || 'tattoo artwork'} in full size`}
        >
          <div className="gallery-card__image">
            <SmartImage
              src={item.src}
              alt={item.alt || 'tattoo'}
              width={640}
              height={640}
              className="gallery-card__img"
              priority={idx < 3}
              data-e2e-id={`gallery-img-${idx}`}
            />
          </div>
          {(item.caption || item.alt) && (
            <figcaption className="gallery-card__caption" data-e2e-id={`gallery-caption-${idx}`}>
              {item.caption || item.alt}
            </figcaption>
          )}
        </button>
      </figure>
    ));
  }, [items, loading, onSelect]);

  return (
    <div className="gallery-grid" data-state={loading ? 'loading' : 'idle'}>
      {content}
    </div>
  );
}
