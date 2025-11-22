import Hero from '../components/Hero';
import { getHeroImages } from '../lib/hero-gallery';
import { createPageMetadata } from '../lib/site-metadata';

export const revalidate = 300;

export async function generateMetadata() {
  const heroImages = await getHeroImages();
  const first = heroImages && heroImages.length > 0 ? heroImages[0] : undefined;
  // use the first hero image as a page-specific Open Graph image when available
  return createPageMetadata({
    title: `${process.env.NEXT_PUBLIC_SITE_TITLE ?? 'Ink Pup'} — Home`,
    description: `Custom tattoos, re-works, consults, and aftercare. Serving ${process.env.NEXT_PUBLIC_SITE_CITY ?? 'the GTA'}.`,
    openGraph: {
      images: first ? [{ url: first.src, alt: first.alt ?? 'Hero image' }] : undefined
    }
  });
}

export default async function Home() {
  const heroImages = await getHeroImages();

  return (
    <Hero heroImages={heroImages} />
  );
}
