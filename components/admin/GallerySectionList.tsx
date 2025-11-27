'use client';

import { useState } from 'react';
import GallerySection, { type GalleryItem } from './GallerySection';
import type { JobSummaryData } from './GalleryUploadPanel';
import { GALLERY_CATEGORIES, type GalleryCategory } from '../../lib/gallery-types';

export interface CategoryData {
  category: GalleryCategory;
  images: {
    items: GalleryItem[];
  };
}

interface GallerySectionListProps {
  categories: CategoryData[];
  jobSummary: JobSummaryData;
  canMutate: boolean;
}

/**
 * Manages expand/collapse state for all gallery sections.
 * Renders all categories as collapsible accordion sections.
 */
export default function GallerySectionList({
  categories,
  jobSummary,
  canMutate,
}: GallerySectionListProps) {
  // Default: first category expanded
  const [expandedSections, setExpandedSections] = useState<Set<GalleryCategory>>(() => {
    const firstCategory = GALLERY_CATEGORIES[0];
    return new Set([firstCategory]);
  });

  const handleToggle = (category: GalleryCategory) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Sort categories to match GALLERY_CATEGORIES order
  const sortedCategories = [...categories].sort((a, b) => {
    return GALLERY_CATEGORIES.indexOf(a.category) - GALLERY_CATEGORIES.indexOf(b.category);
  });

  return (
    <div className="gallery-section-list">
      {sortedCategories.map((catData) => (
        <GallerySection
          key={catData.category}
          category={catData.category}
          images={catData.images.items}
          jobSummary={jobSummary}
          canMutate={canMutate}
          isExpanded={expandedSections.has(catData.category)}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
