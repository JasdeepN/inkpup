"use client";

import { useMemo, useRef } from 'react';
import SmartImage from './SmartImage';
import RevealOnScroll from './animations/RevealOnScroll';
import { generateStaggerDelays } from '../lib/animations/stagger';
import { useCursorPosition } from '../lib/hooks/useCursorPosition';
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
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Phase 2.3: Cursor spotlight effect
  const cursorPosition = useCursorPosition(gridRef, items.length > 0);
  
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
              {/* Hover overlay with info reveal */}
              <div className="gallery-card__overlay" aria-hidden="true">
                <span className="gallery-card__overlay-title">
                  {item.alt || 'View artwork'}
                </span>
                {captionsEnabled && item.caption && (
                  <span className="gallery-card__overlay-caption">{item.caption}</span>
                )}
              </div>
            </div>
          </button>
        </figure>
      </RevealOnScroll>
    ));
  }, [captionsEnabled, fallbackActive, items, loading, onSelect, staggerDelays]);

  return (
    <div 
      ref={gridRef}
      className="gallery-grid" 
      data-state={loading ? 'loading' : 'idle'}
      style={{
        '--cursor-x': cursorPosition.x,
        '--cursor-y': cursorPosition.y,
      } as React.CSSProperties}
    >
      {content}
    </div>
  );
}
