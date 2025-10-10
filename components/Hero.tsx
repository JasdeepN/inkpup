import SmartImage from './SmartImage';
import Link from 'next/link';

type HeroImageProps = Readonly<{
  src: string;
  alt: string;
  caption?: string;
}>;

type HeroProps = Readonly<{
  title?: string;
  subtitle?: string;
  heroImage?: HeroImageProps | null;
}>;

export default function Hero({
  title = 'Custom Tattoos, Consults & Re-Works',
  subtitle = 'InkPup Tattoos — Toronto (GTA). Book by appointment.',
  heroImage,
}: HeroProps) {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="space-y-6">
          <h1 className="hero-title text-4xl md:text-5xl" data-testid="hero-title">{title}</h1>
          <p className="hero-subtitle text-lg" data-testid="hero-subtitle">{subtitle}</p>
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
        {heroImage?.src && (
          <div className="hidden md:block">
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
        )}
      </div>
    </section>
  );
}
