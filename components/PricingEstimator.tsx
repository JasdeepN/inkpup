'use client';

import { useState, useEffect } from 'react';
import { pricing as defaultPricing, estimatePriceRange, formatRange, type PricingDataShape } from '@/lib/pricing';
import { startViewTransition, supportsViewTransitions } from '@/lib/animations/viewTransitions';

interface PricingEstimatorProps {
  initialData?: PricingDataShape;
}

export default function PricingEstimator({ initialData }: PricingEstimatorProps) {
  // Use initialData from server (D1) or fall back to static JSON
  const pricing = initialData ?? defaultPricing;
  
  const [sizeId, setSizeId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [colorType, setColorType] = useState<'monochrome' | 'color'>('monochrome');
  const [colorProfileId, setColorProfileId] = useState('monochrome_black_grey');
  
  const range = sizeId && styleId 
    ? estimatePriceRange(sizeId, styleId, colorProfileId, pricing)
    : null;

  // Ensure the colorProfile selection remains sensible with the chosen color type
  useEffect(() => {
    const monoIds = ['monochrome_black_grey', 'grey_wash'];
    const colorIds = pricing.colorProfiles.map(cp => cp.id).filter(id => !monoIds.includes(id));
    if (colorType === 'monochrome') {
      if (!monoIds.includes(colorProfileId)) setColorProfileId(monoIds[0]);
    } else {
      if (!colorIds.includes(colorProfileId)) setColorProfileId(colorIds[0] || 'full_color');
    }
  }, [colorType, colorProfileId, pricing.colorProfiles]);

  // If the user picks a style that commonly defaults to Color or Monochrome, auto-select a reasonable colorType
  useEffect(() => {
    if (!styleId) return;
    const prefersColor = new Set(['watercolor', 'traditional', 'neo_traditional', 'new_school', 'realism_portrait', 'japanese', 'illustrative']);
    const defaultType = prefersColor.has(styleId) ? 'color' : 'monochrome';
    if (defaultType !== colorType) setColorType(defaultType as 'monochrome' | 'color');
  }, [styleId, colorType]);

  return (
    <div className="glass-panel glass-panel--interactive p-6 space-y-6">
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
            onChange={(e) => {
              const val = e.target.value;
              void startViewTransition(() => setSizeId(val));
            }}
            className="mt-1 p-2 border rounded bg-surface text-primary"
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
          <span className="font-medium mb-1">Style</span>
          <select
            value={styleId}
            onChange={(e) => {
              const val = e.target.value;
              void startViewTransition(() => setStyleId(val));
            }}
            className="mt-1 p-2 border rounded bg-surface text-primary"
            aria-describedby="style-help"
          >
            <option value="">Select style…</option>
            {(pricing.styles || pricing.complexityMultipliers).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span id="style-help" className="text-xs text-muted mt-1">
            Pick the artistic style (e.g., Traditional, Realism, Watercolor)
          </span>
          {styleId && (
            <p className="text-xs text-muted mt-1">
              {((pricing.styles || pricing.complexityMultipliers) as any).find((s: any) => s.id === styleId)?.description}
            </p>
          )}
        </label>

        <div className="flex flex-col text-sm">
          <span className="font-medium mb-1">Color Type</span>
          <div className="mt-1 flex gap-3 items-center" role="radiogroup" aria-label="Color type">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="color-type"
                value="monochrome"
                checked={colorType === 'monochrome'}
                onChange={() => void startViewTransition(() => setColorType('monochrome'))}
                className="accent-accent"
              />
              <span>Monochrome</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="color-type"
                value="color"
                checked={colorType === 'color'}
                onChange={() => void startViewTransition(() => setColorType('color'))}
                className="accent-accent"
              />
              <span>Color</span>
            </label>
          </div>

          <label className="flex flex-col mt-3">
            <span className="font-medium mb-1">Color Profile</span>
            <select
              value={colorProfileId}
              onChange={(e) => {
                const val = e.target.value;
                void startViewTransition(() => setColorProfileId(val));
              }}
              className="mt-1 p-2 border rounded bg-surface text-primary"
              aria-describedby="color-help"
            >
              {pricing.colorProfiles
                .filter((cp) => (
                  colorType === 'monochrome'
                    ? ['monochrome_black_grey', 'grey_wash'].includes(cp.id)
                    : !['monochrome_black_grey', 'grey_wash'].includes(cp.id)
                ))
                .map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.label}
                  </option>
                ))}
            </select>
            <span id="color-help" className="text-xs text-muted mt-1">
              Full color adds 20–30% due to layering and blending time
            </span>
          </label>
        </div>
      </fieldset>

      {range && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Estimated Range (CAD)</span>
            <span 
              className="text-2xl font-bold text-accent" 
              data-testid="pricing-estimate"
              style={supportsViewTransitions() ? { viewTransitionName: 'pricing-estimate' } as any : {}}
            >
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
