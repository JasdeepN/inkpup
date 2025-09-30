import './globals.scss';
import { Meta } from '../components/Meta';
import LocalBusinessJsonLd from '../components/LocalBusinessJsonLd';
import business from '../data/business.json';
import Header from '../components/Header';

export const metadata = {
  title: `${business.name} — ${business.address.city}`,
  description: `Custom tattoos, cover-ups, and aftercare. Serving ${business.address.city} and the GTA.`
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
  <a href="#content" className="skip-link sr-only focus:not-sr-only" data-testid="skip-link">Skip to content</a>
        <Meta title={metadata.title} description={metadata.description} url={business.website} />
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

        <div id="app-root">
          <Header />
          <main id="content" className="py-6 container">{children}</main>
          <footer className="border-t border-gray-200">
            <div className="container py-4">
              <p>Find us on Instagram: <a className="text-accent underline" href="https://www.instagram.com/inkpup.tattoos/">@inkpup.tattoos</a></p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
