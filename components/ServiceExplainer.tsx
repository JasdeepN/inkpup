import Link from 'next/link';

export default function ServiceExplainer() {
  return (
    <section className="service-explainer">
      <div className="container">
        <h2 className="service-explainer__heading">Choose Your Path</h2>
        
        <div className="service-explainer__grid">
          {/* Flash Tattoos Column */}
          <div className="service-explainer__card service-explainer__card--flash">
            <div className="service-explainer__icon">⚡</div>
            <h3 className="service-explainer__title">Flash Tattoos</h3>
            <p className="service-explainer__subtitle">Ready-to-Ink Art</p>
            
            <ul className="service-explainer__benefits">
              <li>✓ Pre-designed artwork</li>
              <li>✓ Quick booking process</li>
              <li>✓ Affordable pricing</li>
              <li>✓ Same-week availability</li>
            </ul>
            
            <Link href="/flash" className="btn btn--flash">
              View Available Flash
            </Link>
          </div>

          {/* Custom Designs Column */}
          <div className="service-explainer__card service-explainer__card--custom">
            <div className="service-explainer__icon">✨</div>
            <h3 className="service-explainer__title">Custom Designs</h3>
            <p className="service-explainer__subtitle">Your Vision, Our Artistry</p>
            
            <ul className="service-explainer__benefits">
              <li>✓ One-of-a-kind artwork</li>
              <li>✓ Collaborative process</li>
              <li>✓ Your vision realized</li>
              <li>✓ Worth the wait</li>
            </ul>
            
            <Link href="/custom-design" className="btn btn--custom">
              Start Your Project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
