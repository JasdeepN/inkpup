import Link from 'next/link';
import SmartImage from './SmartImage';
import HeroCarousel, { CarouselImage } from './HeroCarousel';

type HeroImageProps = Readonly<{
  src: string;
  alt: string;
  caption?: string;
}>;

type HeroProps = Readonly<{
  title?: string;
  subtitle?: string;
  heroImage?: HeroImageProps | null;
  // accept multiple hero images (server-provided) under `heroImages`
  heroImages?: CarouselImage[] | null;
}>;

export default function Hero({
  title = 'Custom Tattoos, Consults & Re-Works',
  subtitle = 'InkPup Tattoos — Toronto (GTA). Book by appointment.',
  heroImage,
  heroImages,
}: HeroProps) {
  const hasCarousel = Array.isArray(heroImages) && heroImages.length > 0;

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-copy space-y-6">
          <h1 className="hero-title text-3xl md:text-5xl" data-testid="hero-title">{title}</h1>
          <p className="hero-subtitle text-lg" data-testid="hero-subtitle">{subtitle}</p>
        </div>

        {hasCarousel ? (
          <div className="hero-media">
            <HeroCarousel images={heroImages!} />
          </div>
        ) : heroImage?.src ? (
          <div className="hero-media">
            <div className="hero-image">
              <SmartImage
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                className="w-full h-full object-cover"
                sizes="(min-width: 1024px) 640px, 90vw"
                priority
              />
            </div>
            {heroImage.caption && (
              <p className="sr-only">{heroImage.caption}</p>
            )}
          </div>
        ) : null}

        <div className="hero-actions">
          <Link href="/contact" className="btn btn--primary" data-testid="hero-book">Book an appointment</Link>
          <a
            href="https://www.instagram.com/inkpup.tattoos/"
            target="_blank"
            rel="noreferrer"
            className="btn btn--instagram"
            aria-label="View Ink Pup Tattoos on Instagram"
            data-testid="hero-instagram"
          >
            <svg
              className="site-footer__cta-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 188.6c-40.7 0-73.7-33-73.7-73.7s33-73.7 73.7-73.7 73.7 33 73.7 73.7-33 73.7-73.7 73.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8 0-14.9 12-26.8 26.8-26.8 15 0 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-94C379.6 41.5 347.8 33.3 311.9 31.6 275.2 29.6 172.9 29.6 136.2 31.6 100.3 33.3 68.5 41.5 42.2 67.8 15.9 94.1 7.7 125.9 6 161.8 4 198.5 4 300.9 6 337.6c1.7 35.9 9.9 67.7 36.2 94 26.3 26.3 58.1 34.5 94 36.2 36.7 2 139.1 2 175.8 0 35.9-1.7 67.7-9.9 94-36.2 26.3-26.3 34.5-58.1 36.2-94 2-36.7 2-139.1 0-175.8zM398.8 388c-7.8 19.6-23 34.8-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.8-23-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 23-34.8 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.8 23 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
            </svg>
            <span className="site-footer__cta-text">View Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}
