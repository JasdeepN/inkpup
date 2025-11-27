'use client';

import { useState } from 'react';
import UploadForm from './UploadForm';
import type { GalleryCategory } from '../../lib/gallery-types';
import { getCategoryLabel } from '../../lib/gallery-types';

export interface JobSummaryData {
  queued: number;
  scheduled: number;
  deadLetter: number;
  nextReadyAt?: number | null;
  oldestQueuedAt?: string | null;
}

interface GalleryUploadPanelProps {
  category: GalleryCategory;
  jobSummary: JobSummaryData;
  canMutate: boolean;
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
 * Collapsible upload panel for the Gallery page.
 * Shows upload form in an expandable section.
 */
export default function GalleryUploadPanel({
  category,
  canMutate,
}: GalleryUploadPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="gallery-upload-panel">
      <button
        type="button"
        className="gallery-upload-panel__header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="upload-panel-content"
      >
        <div className="gallery-upload-panel__title">
          <span>Upload to {getCategoryLabel(category)}</span>
        </div>
        <ChevronIcon
          className={`gallery-upload-panel__toggle ${isExpanded ? '' : 'gallery-upload-panel__toggle--closed'}`}
        />
      </button>

      {isExpanded && (
        <div
          id="upload-panel-content"
          className="gallery-upload-panel__content"
        >
          <UploadForm canMutate={canMutate} category={category} />
        </div>
      )}
    </div>
  );
}
