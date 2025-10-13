"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { GalleryItem, GalleryCategory } from '../lib/gallery-types';
import { GALLERY_CATEGORIES, getCategoryLabel } from '../lib/gallery-types';
import Gallery from './Gallery';
import SmartImage from './SmartImage';
import { isGalleryCaptionsEnabled } from '../lib/featureFlags';
import type { GalleryFallbackReason } from '../lib/r2-server';

export type GalleryFallbackCode = GalleryFallbackReason | 'unexpected_error';

type GalleryViewProps = {
  readonly initialCategory: GalleryCategory;
  readonly initialData: {
    items: GalleryItem[];
    fallback: boolean;
    fallbackReason?: GalleryFallbackCode;
    usedBundledFallback: boolean;
    credentialStatus?: {
      accountId: boolean;
      bucket: boolean;
      accessKey: boolean;
      secretAccessKey: boolean;
    };
  };
};

type GalleryRecord = Partial<Record<GalleryCategory, GalleryItem[]>>;
type FallbackRecord = Partial<Record<GalleryCategory, {
  fallback: boolean;
  fallbackReason?: GalleryFallbackCode;
  usedBundledFallback: boolean;
  credentialStatus?: {
    accountId: boolean;
    bucket: boolean;
    accessKey: boolean;
    secretAccessKey: boolean;
  };
}>>;

export default function GalleryView({ initialCategory, initialData }: GalleryViewProps) {
  const captionsEnabled = isGalleryCaptionsEnabled();
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>(initialCategory);
  const [itemsByCategory, setItemsByCategory] = useState<GalleryRecord>({ [initialCategory]: initialData.items });
  const [fallbackByCategory, setFallbackByCategory] = useState<FallbackRecord>({
    [initialCategory]: {
      fallback: initialData.fallback,
      fallbackReason: initialData.fallbackReason,
      usedBundledFallback: initialData.usedBundledFallback,
      credentialStatus: initialData.credentialStatus,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [imageMeta, setImageMeta] = useState<{ naturalWidth: number; naturalHeight: number } | null>(null);
  const [modalSize, setModalSize] = useState<{ width: number; height: number } | null>(null);

  const items = useMemo(() => itemsByCategory[activeCategory] ?? [], [activeCategory, itemsByCategory]);
  const fallbackState = fallbackByCategory[activeCategory] ?? { fallback: false, usedBundledFallback: false };
  const fallbackDetail = useMemo(() => {
    switch (fallbackState.fallbackReason) {
      case 'missing_credentials':
        return 'We need to refresh our storage credentials to resume live updates.';
      case 'client_initialization_failed':
        return 'Our storage client could not initialize; we are investigating the connection.';
      case 'r2_fetch_failed':
        return 'Cloudflare R2 is currently unreachable, so image updates may be delayed.';
      case 'unexpected_error':
        return 'An unexpected error occurred while retrieving live images.';
      default:
        return null;
    }
  }, [fallbackState.fallbackReason]);

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
      const payload = (await res.json()) as {
        items: GalleryItem[];
        fallback?: boolean;
        fallbackReason?: GalleryFallbackCode;
        usedBundledFallback?: boolean;
        credentialStatus?: {
          accountId: boolean;
          bucket: boolean;
          accessKey: boolean;
          secretAccessKey: boolean;
        };
      };
      setItemsByCategory((prev) => ({ ...prev, [category]: payload.items }));
      setFallbackByCategory((prev) => ({
        ...prev,
        [category]: {
          fallback: Boolean(payload.fallback),
          fallbackReason: payload.fallbackReason,
          usedBundledFallback: Boolean(payload.usedBundledFallback),
          credentialStatus: payload.credentialStatus,
        },
      }));
      setActiveCategory(category);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load gallery.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [itemsByCategory]);

  const closeModal = useCallback(() => {
    setSelected(null);
    setImageMeta(null);
    setModalSize(null);
  }, []);

  const updateModalSize = useCallback(
    (dimensions: { naturalWidth: number; naturalHeight: number }) => {
      if (typeof window === 'undefined') return;
      const maxWidth = Math.min(window.innerWidth * 0.9, 960);
      const maxHeight = Math.min(window.innerHeight * 0.9, 720);

      const scale = Math.min(
        maxWidth / dimensions.naturalWidth,
        maxHeight / dimensions.naturalHeight,
        1,
      );

      const width = Math.max(280, Math.round(dimensions.naturalWidth * scale));
      const height = Math.max(280, Math.round(dimensions.naturalHeight * scale));
      setModalSize({ width, height });
    },
    [],
  );

  useEffect(() => {
    if (!imageMeta) return;

    const handleResize = () => updateModalSize(imageMeta);
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageMeta, updateModalSize]);

  const handleImageLoad = useCallback(
    (img: HTMLImageElement) => {
      const dimensions = { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
      setImageMeta(dimensions);
      updateModalSize(dimensions);
    },
    [updateModalSize],
  );

  useEffect(() => {
    if (!selected) {
      setImageMeta(null);
      setModalSize(null);
    }
  }, [selected]);

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

      {fallbackState.fallback && (
        <section className="gallery-warning">
          <output aria-live="polite">
            {fallbackState.usedBundledFallback
              ? "We're having trouble reaching our Cloudflare R2 storage container right now. These photos are from a backup set and might be a little out of date."
              : "We're having trouble reaching our Cloudflare R2 storage container right now. The gallery will repopulate once storage is back online."}
            {fallbackDetail ? ` ${fallbackDetail}` : ''}
          </output>
        </section>
      )}

      <Gallery
        items={items}
        loading={loading}
        onSelect={setSelected}
        fallbackActive={fallbackState.usedBundledFallback}
      />

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
            <div
              className="gallery-modal__image"
              style={modalSize ? { width: `${modalSize.width}px`, height: `${modalSize.height}px` } : undefined}
            >
              <SmartImage
                src={selected.src}
                alt={selected.alt ?? 'Tattoo artwork'}
                fill
                sizes="(min-width: 1024px) 70vw, 90vw"
                className="gallery-modal__img"
                onLoadingComplete={handleImageLoad}
              />
            </div>
            {(selected.alt || (captionsEnabled && selected.caption)) && (
              <div className="gallery-modal__footer">
                <p className="gallery-modal__title">{selected.alt || 'Untitled artwork'}</p>
                {captionsEnabled && selected.caption && (
                  <p className="gallery-modal__caption">{selected.caption}</p>
                )}
              </div>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
