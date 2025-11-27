'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getCategoryLabel, type GalleryCategory } from '../../lib/gallery-types';
import GalleryUploadPanel, { type JobSummaryData } from './GalleryUploadPanel';
import DeleteButton from '../../app/gallery/DeleteButton';
import ImageModal from './ImageModal';

export interface GalleryItem {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  size?: number;
  lastModified?: string;
  key?: string;
}

interface GallerySectionProps {
  category: GalleryCategory;
  images: GalleryItem[];
  jobSummary: JobSummaryData;
  canMutate: boolean;
  isExpanded: boolean;
  onToggle: (category: GalleryCategory) => void;
}

/**
 * Chevron icon for expand/collapse toggle
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Collapsible gallery section for a single category.
 * Shows category header with image count, expandable to reveal images + upload panel.
 */
export default function GallerySection({
  category,
  images,
  jobSummary,
  canMutate,
  isExpanded,
  onToggle,
}: GallerySectionProps) {
  const imageCount = images.length;
  const label = getCategoryLabel(category);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const handleImageClick = (e: React.MouseEvent, src: string, alt: string) => {
    e.preventDefault();
    setModalImage({ src, alt });
  };

  return (
    <div className="gallery-section admin-card">
      <button
        type="button"
        className="gallery-section__header"
        onClick={() => onToggle(category)}
        aria-expanded={isExpanded}
        aria-controls={`gallery-section-${category}`}
      >
        <div className="gallery-section__title">
          <span className="gallery-section__icon">📁</span>
          <span>{label}</span>
          <span className="gallery-section__count">
            {imageCount} {imageCount === 1 ? 'image' : 'images'}
          </span>
        </div>
        <ChevronIcon
          className={`gallery-section__toggle ${isExpanded ? '' : 'gallery-section__toggle--closed'}`}
        />
      </button>

      {/* Animated content wrapper using CSS grid */}
      <div
        className={`gallery-section__body ${isExpanded ? 'gallery-section__body--expanded' : ''}`}
      >
        <div
          id={`gallery-section-${category}`}
          className="gallery-section__content"
          aria-hidden={!isExpanded}
        >
          {/* Upload Panel */}
          <GalleryUploadPanel
            category={category}
            jobSummary={jobSummary}
            canMutate={canMutate}
          />

          {/* Image Grid */}
          <div className="gallery-section__gallery">
            {imageCount === 0 ? (
              <p className="admin-empty-state">No artwork uploaded yet for this category.</p>
            ) : (
              <ul className="admin-gallery__grid admin-gallery__grid--compact">
                {images.map((item, index) => (
                  <li key={item.id} className="admin-gallery__item admin-gallery__item--compact">
                    <div className="admin-gallery__preview-wrapper">
                      <button
                        type="button"
                        onClick={(e) => handleImageClick(e, item.src, item.alt || item.caption || 'Gallery image')}
                        className="admin-gallery__preview admin-gallery__preview--clickable"
                        title="Click to view full size"
                      >
                        <Image
                          src={item.src}
                          alt={item.alt || item.caption || 'Gallery image'}
                          className="admin-gallery__image"
                          width={item.width || 800}
                          height={item.height || 800}
                          priority={index < 4 && isExpanded}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                        />
                      </button>
                      <DeleteButton
                        category={category}
                        itemKey={item.key!}
                        canMutate={canMutate}
                        iconOnly
                        className="admin-gallery__delete-x"
                      />
                    </div>
                    <div className="admin-gallery__meta admin-gallery__meta--compact">
                      <strong>{item.caption || item.alt}</strong>
                      <span className="text-muted text-xs">
                        {item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''}
                        {item.size && item.lastModified ? ' • ' : ''}
                        {item.lastModified ? new Date(item.lastModified).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}
