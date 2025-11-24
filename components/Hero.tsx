import Link from 'next/link';
import SmartImage from './SmartImage';
import HeroCarousel, { CarouselImage } from './HeroCarousel';
import RevealOnScroll from './animations/RevealOnScroll';

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
        {/* Tailwind's `container` utility applies responsive max-widths which is likely the cause
          of the subtitle and other content appearing "clamped". Remove or override it
          if you need full-bleed content. */}
        <div className="container">
        <div className="hero-copy pt-6">
          <RevealOnScroll>
          <h1 className="hero-title text-3xl md:text-5xl pt-6" data-testid="hero-title">{title}</h1>
          {subtitle && (
            <p
              className="hero-subtitle text-base lg:text-lg mt-3 mb-6 pb-10 w-full max-w-none"
              data-testid="hero-subtitle"
            >
              {subtitle}
            </p>
          )}
          </RevealOnScroll>
          <div className="hero-paths pt-6" data-testid="hero-paths">
            <RevealOnScroll delay={100}>
            <div className="hero-path-card hero-path-card--flash" data-testid="hero-path-flash">
              <div className="hero-path-card__icon" aria-hidden="true">⚡</div>
              <h2 className="hero-path-card__title">Flash Tattoos</h2>
              <ul className="hero-path-card__list">
                <li>Pre-designed artwork</li>
                <li>Quick booking</li>
                <li>Same-week availability</li>
              </ul>
              <Link href="/flash" className="btn btn--flash w-full" data-testid="hero-flash">Browse Flash</Link>
            </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
            <div className="hero-path-card hero-path-card--custom" data-testid="hero-path-custom">
              <div className="hero-path-card__icon" aria-hidden="true">✨</div>
              <h2 className="hero-path-card__title">Custom Designs</h2>
              <ul className="hero-path-card__list">
                <li>One-of-a-kind art</li>
                <li>Collaborative process</li>
                <li>Your vision realized</li>
              </ul>
              <Link href="/custom-design" className="btn btn--custom w-full" data-testid="hero-custom">Request Custom Design</Link>
            </div>
            </RevealOnScroll>
          </div>
        </div>

        {(() => {
          if (hasCarousel) {
            return (
              <div className="hero-media">
                {/* heroImages is non-null here due to hasCarousel guard */}
                <HeroCarousel images={heroImages || []} />
              </div>
            );
          }
          if (heroImage?.src) {
            return (
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
            );
          }
          return null;
        })()}

      </div>
    </section>
  );
}
