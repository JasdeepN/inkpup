import { Metadata } from 'next';
import { GALLERY_CATEGORIES } from '../../lib/gallery-types';
import { listGalleryImages, hasR2Credentials, getUploadJobSummary } from '../../lib/r2-server';
import GallerySectionList from '../../components/admin/GallerySectionList';
import React from 'react';

export const metadata: Metadata = {
  title: 'Gallery Management',
};

export default async function AdminGalleryPage() {
  const canMutate = hasR2Credentials();
  
  // Fetch all categories in parallel
  const [jobSummary, ...galleryResults] = await Promise.all([
    getUploadJobSummary(),
    ...GALLERY_CATEGORIES.map((cat) => listGalleryImages(cat).asPromise()),
  ]);

  // Combine into category data array
  const categories = GALLERY_CATEGORIES.map((cat, index) => ({
    category: cat,
    images: galleryResults[index],
  }));

  const pendingJobs = jobSummary.queued + jobSummary.scheduled;

  return (
    <div className="admin-shell">
      <h1 className="text-2xl font-bold mb-4">
        Gallery management
        {pendingJobs > 0 && (
          <span className="gallery-upload-panel__badge gallery-upload-panel__badge--pending ml-3">
            {pendingJobs} processing
          </span>
        )}
      </h1>
      <GallerySectionList
        categories={categories}
        jobSummary={jobSummary}
        canMutate={canMutate}
      />
    </div>
  );
}

