import type { Metadata } from 'next';
import business from '../data/business.json';

const title = `${business.name} — ${business.address.city}`;
const description = `Custom tattoos, re-works, consults, and aftercare. Serving ${business.address.city} and the GTA.`;
const canonicalUrl = business.website;

const baseMetadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    title,
    description,
    siteName: business.name
  },
  twitter: {
    card: 'summary',
    title,
    description
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png'
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

export const siteMetadata: Metadata = baseMetadata;

export const siteMetadataFields = {
  title,
  description,
  canonicalUrl
};
