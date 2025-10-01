import SmartImage from './SmartImage';

export default function Hero({ title = 'Custom Tattoos, Consults & Re-Works', subtitle = 'InkPup Tattoos — Toronto (GTA). Book by appointment.' }) {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="space-y-6">
          <h1 className="hero-title text-4xl md:text-5xl" data-testid="hero-title">{title}</h1>
          <p className="hero-subtitle text-lg" data-testid="hero-subtitle">{subtitle}</p>
          <div className="hero-actions">
            <a href="/contact" className="btn btn--primary" data-testid="hero-book">Book an appointment</a>
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
        <div className="hidden md:block">
          <div className="hero-image">
            <SmartImage
              src={'/istockphoto-1147544807-612x612.jpg'}
              alt="tattoo sample"
              width={800}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
