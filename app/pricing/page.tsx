import { Metadata } from 'next';
import PricingEstimator from '../../components/PricingEstimator';
import LocalBusinessJsonLd from '../../components/LocalBusinessJsonLd';
import RevealOnScroll from '../../components/animations/RevealOnScroll';

export const metadata: Metadata = {
  title: 'Tattoo Pricing Toronto | Size, Complexity & Color Costs',
  description: 'Transparent tattoo pricing in Toronto/GTA. Interactive estimator shows typical costs by size, complexity, and color. Custom hourly rates $150–$200. Free consultations.',
  keywords: [
    'tattoo pricing Toronto',
    'tattoo cost calculator',
    'custom tattoo prices',
    'sleeve tattoo cost',
    'color vs black grey pricing',
    'Toronto tattoo rates',
    'GTA tattoo pricing'
  ],
  openGraph: {
    title: 'Tattoo Pricing Toronto | Size, Complexity & Color Costs',
    description: 'Get realistic tattoo price estimates for Toronto/GTA. Interactive tool shows costs by size, complexity, and color.',
    type: 'website',
  },
};

export default function PricingPage() {
  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Custom Tattoo Art",
    "provider": {
      "@type": "LocalBusiness",
      "name": "InkPup Tattoos",
      "image": "https://inkpup.tattoos/og-image.jpg",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Toronto",
        "addressRegion": "ON",
        "addressCountry": "CA"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Toronto"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "CAD",
      "lowPrice": "100",
      "highPrice": "6000",
      "offerCount": "8",
      "priceSpecification": [
        {
          "@type": "PriceSpecification",
          "price": "100-200",
          "priceCurrency": "CAD",
          "name": "Micro / Tiny Tattoo"
        },
        {
          "@type": "PriceSpecification",
          "price": "150-300",
          "priceCurrency": "CAD",
          "name": "Small Tattoo"
        },
        {
          "@type": "PriceSpecification",
          "price": "500-800",
          "priceCurrency": "CAD",
          "name": "Medium Tattoo"
        },
        {
          "@type": "PriceSpecification",
          "price": "1200-2000",
          "priceCurrency": "CAD",
          "name": "Half Sleeve"
        },
        {
          "@type": "PriceSpecification",
          "price": "2000-3500",
          "priceCurrency": "CAD",
          "name": "Full Sleeve"
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      <LocalBusinessJsonLd />

      <article className="max-w-4xl mx-auto space-y-12 pb-12">
        <RevealOnScroll>
        <header className="space-y-4 border-b pb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            Tattoo Pricing in Toronto
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            Transparent, citation-backed pricing guidance for custom tattoos in the Greater Toronto Area. 
            Understand how size, complexity, and color affect your investment.
          </p>
        </header>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
        <section>
          <PricingEstimator />
        </section>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
        <section id="pricing-factors" className="space-y-6">
          <h2 className="text-2xl font-bold">What Affects Tattoo Pricing?</h2>
          
          <div className="space-y-4">
            <div className="glass-panel p-5 space-y-2">
              <h3 className="font-semibold text-lg">Size & Coverage</h3>
              <p className="text-sm text-muted leading-relaxed">
                Larger tattoos require more ink, time, and often multiple sessions. 
                A micro piece (≤1″) may take 30 minutes, while a full sleeve can span 20–35 hours across 4–8 sessions.
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <h3 className="font-semibold text-lg">Complexity & Detail</h3>
              <p className="text-sm text-muted leading-relaxed">
                Realism, portraits, and intricate shading demand advanced technique and precision. 
                Simple linework is faster; photorealistic work with gradients and depth takes significantly longer.
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <h3 className="font-semibold text-lg">Color vs Black & Grey</h3>
              <p className="text-sm text-muted leading-relaxed">
                Full-color tattoos typically add <strong>20–30% time</strong> due to layering, blending, and saturation requirements. 
                Hyper-realistic color work with extensive palette depth can add up to 35% over monochrome equivalents.
              </p>
              <p className="text-xs text-muted italic">
                Sources: Portrait cost analysis (Piranha Tattoo), sleeve pricing trends (46 Tattoo), color vs B&G (multiple Toronto studios)
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <h3 className="font-semibold text-lg">Artist Experience & Style</h3>
              <p className="text-sm text-muted leading-relaxed">
                Toronto custom tattoo artists typically charge <strong>$150–$200/hour</strong>. 
                High-demand realism specialists may charge premium rates reflecting years of portfolio development and expertise.
              </p>
            </div>

            <div className="glass-panel p-5 space-y-2">
              <h3 className="font-semibold text-lg">Placement & Skin Type</h3>
              <p className="text-sm text-muted leading-relaxed">
                Sensitive areas (ribs, feet, hands) or curved surfaces require extra care and may extend session time. 
                Skin tone and texture also influence ink saturation and color vibrancy.
              </p>
            </div>
          </div>
        </section>
        </RevealOnScroll>

        <RevealOnScroll delay={250}>
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Multi-Session Projects</h2>
          <p className="text-muted leading-relaxed">
            Sleeves, back pieces, and large custom designs are completed over multiple sessions to allow proper healing 
            and ensure optimal ink retention. Typical spacing: 2–4 weeks between sessions.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted">
            <li><strong>Half Sleeve:</strong> 10–18 hours across 2–4 sessions</li>
            <li><strong>Full Sleeve:</strong> 20–35 hours across 4–8 sessions</li>
            <li><strong>Full Back:</strong> 35–60+ hours across 8–12 sessions</li>
          </ul>
        </section>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Why Estimates Vary</h2>
          <p className="text-muted leading-relaxed">
            Every tattoo is unique. Factors like custom design complexity, reference photo quality, skin condition, 
            and client pain tolerance all influence final session count and pricing. 
            The estimates above are based on industry averages from multiple Toronto studios—your actual quote will 
            depend on a personalized consultation.
          </p>
        </section>
        </RevealOnScroll>

        <RevealOnScroll delay={350}>
        <section className="bg-accent/5 border border-accent/20 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted leading-relaxed">
            Book a free consultation to discuss your vision, get an accurate quote, and review portfolio examples 
            that match your desired style.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/contact?type=custom" className="btn btn--primary text-center">
              Request Custom Consultation
            </a>
              <a href="/flash" className="btn btn--glass text-center">
              Browse Flash Designs
            </a>
          </div>
        </section>
        </RevealOnScroll>

        <section className="text-xs text-muted space-y-2 pt-6 border-t">
          <h3 className="font-semibold text-sm">Pricing Data Sources</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a 
                href="https://46tattoo.com/blogs/news/how-much-do-tattoos-cost-toronto" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-accent"
              >
                46 Tattoo: Custom $150–200/hr rates
              </a>
            </li>
            <li>
              <a 
                href="https://piranhatattoo.ca/how-much-do-portrait-tattoos-cost-in-toronto/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-accent"
              >
                Piranha Tattoo: Portrait color uplift 20–30%
              </a>
            </li>
            <li>
              <a 
                href="https://piranhatattoo.ca/how-much-do-full-arm-tattoos-cost-in-toronto/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-accent"
              >
                Piranha Tattoo: Full sleeve cost differentials
              </a>
            </li>
            <li>
              <a 
                href="https://piranhatattoo.ca/black-white-vs-colour-does-it-impact-the-price/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-accent"
              >
                Piranha Tattoo: Color vs B&G nuance
              </a>
            </li>
          </ul>
        </section>
      </article>
    </>
  );
}
