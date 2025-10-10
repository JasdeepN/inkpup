"use client";

import { useMemo } from 'react';
import SmartImage from './SmartImage';
import type { GalleryItem } from '../lib/gallery-types';
import { isGalleryCaptionsEnabled } from '../lib/featureFlags';

type GalleryProps = {
  readonly items: GalleryItem[];
  readonly loading?: boolean;
  readonly onSelect?: (item: GalleryItem) => void;
  readonly fallbackActive?: boolean;
};

const skeletonKeys = ['one', 'two', 'three', 'four', 'five', 'six'];

export default function Gallery({ items, loading = false, onSelect, fallbackActive = false }: GalleryProps) {
  const captionsEnabled = isGalleryCaptionsEnabled();
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
          {fallbackActive && <span className="gallery-card__badge">Backup</span>}
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
          {(item.alt || (captionsEnabled && item.caption)) && (
            <figcaption className="gallery-card__meta" data-e2e-id={`gallery-caption-${idx}`}>
              <span className="gallery-card__meta-primary">{item.alt || 'Untitled artwork'}</span>
              {captionsEnabled && item.caption && (
                <span className="gallery-card__meta-secondary">{item.caption}</span>
              )}
            </figcaption>
          )}
        </button>
      </figure>
    ));
  }, [captionsEnabled, fallbackActive, items, loading, onSelect]);

  return (
    <div className="gallery-grid" data-state={loading ? 'loading' : 'idle'}>
      {content}
    </div>
  );
}
