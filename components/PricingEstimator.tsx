'use client';

import { useState } from 'react';
import { pricing, estimatePriceRange, formatRange } from '../lib/pricing';

export default function PricingEstimator() {
  const [sizeId, setSizeId] = useState('');
  const [complexityId, setComplexityId] = useState('');
  const [colorProfileId, setColorProfileId] = useState('monochrome_black_grey');
  
  const range = sizeId && complexityId 
    ? estimatePriceRange(sizeId, complexityId, colorProfileId)
    : null;

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Interactive Pricing Estimator</h3>
        <p className="text-sm text-muted">
          Estimates are based on typical Toronto custom tattoo rates. Final pricing depends on artist style, placement, skin type, and consultation details.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="sr-only">Tattoo pricing options</legend>
        
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">Size Category</span>
          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="p-2 border rounded bg-white text-primary focus:ring-2 focus:ring-accent focus:outline-none"
            aria-describedby="size-help"
          >
            <option value="">Select size…</option>
            {pricing.sizeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <span id="size-help" className="text-xs text-muted mt-1">
            Larger tattoos require more time and multiple sessions
          </span>
        </label>

        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">Complexity & Style</span>
          <select
            value={complexityId}
            onChange={(e) => setComplexityId(e.target.value)}
            className="p-2 border rounded bg-white text-primary focus:ring-2 focus:ring-accent focus:outline-none"
            aria-describedby="complexity-help"
          >
            <option value="">Select complexity…</option>
            {pricing.complexityMultipliers.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.label}
              </option>
            ))}
          </select>
          <span id="complexity-help" className="text-xs text-muted mt-1">
            Realism and portraits require advanced shading techniques
          </span>
        </label>

        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">Color Profile</span>
          <select
            value={colorProfileId}
            onChange={(e) => setColorProfileId(e.target.value)}
            className="p-2 border rounded bg-white text-primary focus:ring-2 focus:ring-accent focus:outline-none"
            aria-describedby="color-help"
          >
            {pricing.colorProfiles.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.label}
              </option>
            ))}
          </select>
          <span id="color-help" className="text-xs text-muted mt-1">
            Full color adds 20–30% due to layering and blending time
          </span>
        </label>
      </fieldset>

      {range && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Estimated Range (CAD)</span>
            <span className="text-2xl font-bold text-accent" data-testid="pricing-estimate">
              {formatRange(range)}
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            This estimate is based on Toronto industry averages ($150–$200/hr typical). 
            Actual pricing varies by artist experience, session count, and design refinement. 
            <strong className="text-primary"> Book a free consultation</strong> for an accurate quote.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="/contact?type=custom"
          className="btn btn--primary text-center"
        >
          Request Consultation
        </a>
        <a
          href="#pricing-factors"
            className="btn btn--glass text-center"
        >
          Learn About Pricing
        </a>
      </div>
    </div>
  );
}
