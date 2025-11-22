"use client";

import { useMemo } from 'react';
import SmartImage from './SmartImage';
import RevealOnScroll from './animations/RevealOnScroll';
import { generateStaggerDelays } from '../lib/animations/stagger';
import type { GalleryItem } from '../lib/gallery-types';
import { isGalleryCaptionsEnabled } from '../lib/featureFlags';

type GalleryProps = {
  readonly items: GalleryItem[];
  readonly loading?: boolean;
  readonly onSelect?: (item: GalleryItem, trigger: HTMLButtonElement) => void;
  readonly fallbackActive?: boolean;
};

const skeletonKeys = ['one', 'two', 'three', 'four', 'five', 'six'];

export default function Gallery({ items, loading = false, onSelect, fallbackActive = false }: GalleryProps) {
  const captionsEnabled = isGalleryCaptionsEnabled();
  
  // Generate stagger delays for gallery cards (50ms increment, early trigger)
  const staggerDelays = useMemo(() => 
    generateStaggerDelays(items.length, 0, 50),
    [items.length]
  );
  
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
      <RevealOnScroll
        key={item.id ?? `${item.src}-${idx}`}
        delay={staggerDelays[idx]}
        threshold={0.1}
        triggerOnce
      >
        <figure className="gallery-card" data-e2e-id={`gallery-item-${idx}`}>
          <button
            type="button"
            className="gallery-card__inner"
            onClick={(event) => onSelect?.(item, event.currentTarget)}
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
      </RevealOnScroll>
    ));
  }, [captionsEnabled, fallbackActive, items, loading, onSelect, staggerDelays]);

  return (
    <div className="gallery-grid" data-state={loading ? 'loading' : 'idle'}>
      {content}
    </div>
  );
}
