import type { Metadata } from 'next';
import business from '../data/business.json';

const title = `${business.name} — ${business.address.city}`;
const description = `Custom tattoos, re-works, consults, and aftercare. Serving ${business.address.city} and the GTA.`;
const canonicalUrl = business.website;
const defaultOgImage = '/wolf-101711.png';

const baseMetadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    title,
    description,
    siteName: business.name,
    // a sensible default Open Graph image — can be overridden per page
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: `${business.name} — ${business.address.city}`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png'
  },
  // Default robots policy — can be overridden per page if needed
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
};

if (canonicalUrl) {
  try {
    const metadataBase = new URL(canonicalUrl);
    baseMetadata.metadataBase = metadataBase;
    baseMetadata.alternates = { canonical: canonicalUrl };
    baseMetadata.openGraph = {
      ...baseMetadata.openGraph,
      url: canonicalUrl
    };
  } catch {
    // Ignore invalid canonical URLs so local development isn't blocked by bad data.
  }
}

/**
 * A small helper to merge page-specific metadata with site defaults.
 * Use this from route files to keep a single source of truth while allowing
 * per-page overrides (title, description, openGraph images, etc.).
 */
export function createPageMetadata(overrides?: Partial<Metadata>): Metadata {
  const merged: any = { ...baseMetadata, ...overrides };
  if (overrides?.openGraph) merged.openGraph = { ...baseMetadata.openGraph, ...overrides.openGraph };
  if (overrides?.twitter) merged.twitter = { ...baseMetadata.twitter, ...overrides.twitter };
  if (overrides?.icons) {
    if (typeof overrides.icons === 'object' && !Array.isArray(overrides.icons) && typeof baseMetadata.icons === 'object' && baseMetadata.icons !== null && !Array.isArray(baseMetadata.icons)) {
      merged.icons = { ...baseMetadata.icons, ...overrides.icons } as Metadata['icons'];
    } else {
      merged.icons = overrides.icons;
    }
  }
  if (overrides?.alternates) merged.alternates = { ...baseMetadata.alternates, ...overrides.alternates };
  return merged as Metadata;
}

export const siteMetadata: Metadata = baseMetadata;

export const siteMetadataFields = {
  title,
  description,
  canonicalUrl
};
