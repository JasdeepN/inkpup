import './globals.scss';
import { Meta } from '../components/Meta';
import LocalBusinessJsonLd from '../components/LocalBusinessJsonLd';
import business from '../data/business.json';
import Header from '../components/Header';
import ParticlesBackground from '../components/ParticlesBackground';

export const metadata = {
  title: `${business.name} — ${business.address.city}`,
  description: `Custom tattoos, cover-ups, and aftercare. Serving ${business.address.city} and the GTA.`
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head />
  <body>
  <a href="#content" className="skip-link sr-only focus:not-sr-only" data-testid="skip-link">Skip to content</a>
    <Meta title={metadata.title} description={metadata.description} url={business.website} />
    <ParticlesBackground />
        {/* LocalBusiness JSON-LD - populated from `data/business.json` */}
        <LocalBusinessJsonLd
          name={business.name}
          url={business.website}
          phone={business.phone}
          street={business.address.street}
          city={business.address.city}
          region={business.address.region}
          postalCode={business.address.postalCode}
          openingHours={business.hours}
        />

        <div id="app-root" className="site-content">
          <Header />
          <main id="content" className="py-6 container">{children}</main>
          <footer className="site-footer">
            <div className="container site-footer__inner">
              <p>Find us on Instagram: <a className="text-accent underline" href="https://www.instagram.com/inkpup.tattoos/">@inkpup.tattoos</a></p>
              <p className="text-sm text-muted mt-2">Icon (favicon): "Wolf" by <a className="underline" href="https://www.flaticon.com/authors/freepik">Freepik</a> from <a className="underline" href="https://www.flaticon.com/free-icon/wolf_101711">Flaticon</a></p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
