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
            className="hero-link"
            data-testid="hero-portfolio"
          >
            View portfolio
          </a>
        </div>
      </div>
    </section>
  );
}
