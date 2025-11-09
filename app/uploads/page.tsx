import Link from 'next/link';
import { Metadata } from 'next';
import React from 'react';
import UploadForm from '../../components/admin/UploadForm';
import JobSummary from '../../components/admin/JobSummary';
import { getUploadJobSummary, hasR2Credentials } from '../../lib/r2-server';
import type { GalleryCategory } from '../../lib/gallery-types';

const DEFAULT_CATEGORY: GalleryCategory = 'available';

export const metadata: Metadata = {
  title: 'Uploads',
};

export default async function AdminUploadsPage() {
  const jobSummary = await getUploadJobSummary();
  const canMutate = hasR2Credentials();

  return (
    <div className="admin-shell admin-dashboard admin-uploads">
      <section className="admin-dashboard__hero">
        <div className="admin-card admin-dashboard__intro">
          <div>
            <p className="admin-dashboard__eyebrow">Upload workflow</p>
            <h1>Uploads</h1>
            <p className="text-muted">
              Queue new artwork, keep an eye on the worker status, and publish pieces to the public gallery once
              processing completes.
            </p>
          </div>
          <div className="admin-dashboard__actions">
            <Link className="btn btn--primary" href="/gallery">
              Manage gallery
            </Link>
            <Link className="btn btn--secondary" href="/dashboard">
              View dashboard
            </Link>
            <Link className="btn btn--secondary" href="/contact">
              Review contact leads
            </Link>
          </div>
        </div>
        <JobSummary jobSummary={jobSummary} />
      </section>

      <section className="admin-dashboard__grid">
        <article className="admin-card admin-dashboard__panel lg:col-span-2">
          <div className="admin-card__header">
            <h2>Upload new artwork</h2>
            <p className="text-muted">
              Select the best category, add descriptive copy, and we&apos;ll optimize the image before it lands in the
              gallery.
            </p>
          </div>
          {!canMutate && (
            <div className="admin-alert admin-alert--error" role="alert">
              Connect R2 credentials to enable uploads. Update the Cloudflare access keys or worker bindings, then reload
              this page.
            </div>
          )}
          <UploadForm canMutate={canMutate} category={DEFAULT_CATEGORY} />
        </article>

        <article className="admin-card admin-dashboard__panel">
          <div className="admin-card__header">
            <h2>Workflow tips</h2>
            <p className="text-muted">Keep the queue lean and content production predictable.</p>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Stick to images under 10&nbsp;MB for faster optimization and worker throughput.</li>
            <li>Write meaningful alt text so gallery cards stay accessible and SEO-friendly.</li>
            <li>Use captions to note healing stage, artist, or story for the piece.</li>
            <li>Check the worker queue card for stuck jobs before re-uploading duplicates.</li>
            <li>Rotate seasonal or flash artwork into the <strong>available</strong> category for prominence.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
