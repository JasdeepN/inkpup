import './globals.scss';
import Script from 'next/script';
import { Meta } from '../components/Meta';
import LocalBusinessJsonLd from '../components/LocalBusinessJsonLd';
import business from '../data/business.json';
import Header from '../components/Header';
import ParticlesBackground from '../components/ParticlesBackground';

export const metadata = {
  title: `${business.name} — ${business.address.city}`,
  description: `Custom tattoos, re-works, consults, and aftercare. Serving ${business.address.city} and the GTA.`
};

export default function RootLayout({ children }) {
  const cfBeaconToken = (() => {
    const raw = process.env.CF_WEB_ANALYTICS_TOKEN ?? process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN;
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  })();

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
              <div className="site-footer__cta">
                <a
                  className="btn btn--instagram"
                  href="https://www.instagram.com/inkpup.tattoos/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow Ink Pup Tattoos on Instagram"
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
                  <span className="site-footer__cta-text">Follow @inkpup.tattoos</span>
                </a>
              </div>
              <p className="text-sm text-muted mt-2">Icon (favicon): &quot;Wolf&quot; by <a className="underline" href="https://www.flaticon.com/authors/freepik">Freepik</a> from <a className="underline" href="https://www.flaticon.com/free-icon/wolf_101711">Flaticon</a></p>
            </div>
          </footer>
        </div>
        {cfBeaconToken && (
          <Script
            id="cloudflare-web-analytics"
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
          />
        )}
      </body>
    </html>
  );
}
