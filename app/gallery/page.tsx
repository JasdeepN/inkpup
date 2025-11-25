import { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { GALLERY_CATEGORIES, getCategoryLabel, isGalleryCategory } from '../../lib/gallery-types';
import { listGalleryImages, hasR2Credentials, deleteGalleryImage } from '../../lib/r2-server';
import DeleteButton from './DeleteButton';
import AddToHeroButton from './AddToHeroButton';
import React from 'react';

export const metadata: Metadata = {
  title: 'Gallery Management',
};

export default async function AdminGalleryPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  // Await searchParams for Next.js 15+ dynamic API
  const params = searchParams ? await searchParams : {};
  // For simplicity, use 'healed' as default category
  const category = isGalleryCategory(params.category) ? params.category : 'healed';
  const canMutate = hasR2Credentials();
  const gallery = await listGalleryImages(category).asPromise();
  const isHero = category === 'hero';

  return (
    <div className="admin-shell">
      <h1 className="text-2xl font-bold mb-4">Gallery management</h1>
      <nav className="admin-card admin-nav admin-card--compact flex items-center justify-between" aria-label="Admin navigation">
        <div className="admin-category-nav" aria-label="Gallery categories">
          {GALLERY_CATEGORIES.map((cat) => {
            const isActive = cat === category;
            return (
              <a
                key={cat}
                href={`/gallery?category=${cat}`}
                className={`admin-category-nav__link ${isActive ? 'is-active' : ''}`}
              >
                {getCategoryLabel(cat)}
              </a>
            );
          })}
        </div>
      </nav>
      <section className="admin-card admin-gallery mt-6">
        <div className="admin-card__header mb-2">
          <h2 className="text-lg font-semibold">{getCategoryLabel(category)} gallery</h2>
          <p className="text-muted text-sm">Browse previously uploaded artwork and remove items that no longer belong.</p>
        </div>
        {gallery.items.length === 0 ? (
          <p className="admin-empty-state">No artwork uploaded yet for this category.</p>
        ) : (
          <ul className="admin-gallery__grid">
            {gallery.items.map((item: any, index: number) => (
              <li key={item.id} className="admin-gallery__item admin-gallery__item--tight">
                <div className="admin-gallery__preview">
                  <Image
                    src={item.src}
                    alt={item.alt || item.caption || 'Gallery image'}
                    className="admin-gallery__image"
                    width={item.width || 800}
                    height={item.height || 800}
                    priority={index < 4}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                  />
                </div>
                <div className="admin-gallery__meta">
                  <strong className="text-base">{item.caption || item.alt}</strong>
                  <p className="text-muted text-xs">
                    {item.size ? `${(item.size / 1024).toFixed(1)} KB • ` : ''}
                    {item.lastModified ? new Date(item.lastModified).toLocaleString() : 'Uploaded'}
                  </p>
                  <p className="admin-field__hint text-xs" style={{ wordBreak: 'break-all' }}>{item.key ?? 'Fallback item'}</p>
                </div>
                <div className="admin-gallery__actions flex gap-2">
                  <a
                    className="btn btn--primary admin-gallery__action"
                    href={item.src}
                    target="_blank"
                    rel="noreferrer"
                    title="View"
                    aria-label="View"
                  >
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"/>
                    </svg>
                  </a>
                  <DeleteButton category={category} itemKey={item.key} canMutate={canMutate} iconOnly />
                  {!isHero && (
                    <AddToHeroButton itemKey={item.key} iconOnly />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
