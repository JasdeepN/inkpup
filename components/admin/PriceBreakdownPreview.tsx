'use client';

import { useState, useMemo } from 'react';
import {
  calculatePriceBreakdown,
  formatPriceRange,
  formatAddition,
  type PriceBreakdown,
} from '../../lib/pricing-breakdown';
import type { SizeCategory, Style, ColorProfile } from '../../types/cloudflare.d';

interface PriceBreakdownPreviewProps {
  sizes: SizeCategory[];
  styles: Style[];
  colors: ColorProfile[];
  defaultSizeId?: string;
  defaultStyleId?: string;
  defaultColorId?: string;
}

/**
 * Progress bar component for showing contribution percentages
 */
function ContributionBar({
  label,
  percentage,
  amount,
  variant,
  multiplier,
}: {
  label: string;
  percentage: number;
  amount: string;
  variant: 'size' | 'style' | 'color';
  multiplier?: number;
}) {
  const variantColors = {
    size: 'bg-blue-500',
    style: 'bg-purple-500',
    color: 'bg-green-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-300">
          {label}
          {multiplier && multiplier !== 1 && (
            <span className="text-gray-500 ml-1">(×{multiplier.toFixed(2)})</span>
          )}
        </span>
        <span className="text-gray-400">{amount}</span>
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${variantColors[variant]} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-500">{percentage.toFixed(1)}%</div>
    </div>
  );
}

/**
 * Breakdown display showing all price components
 */
function BreakdownDisplay({ breakdown }: { breakdown: PriceBreakdown | null }) {
  if (!breakdown) {
    return (
      <div className="text-center text-gray-500 py-4">
        Select size, style, and color to see breakdown
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          Breakdown
        </h4>

        <div className="space-y-4">
          {/* Base Price (Size) */}
          <ContributionBar
            label="Base Price"
            percentage={breakdown.contributions.size}
            amount={formatPriceRange(breakdown.baseRange)}
            variant="size"
          />

          {/* Style Contribution */}
          <ContributionBar
            label="Style"
            percentage={breakdown.contributions.style}
            amount={formatAddition(breakdown.additions.style)}
            variant="style"
            multiplier={breakdown.styleMultiplier}
          />

          {/* Color Contribution */}
          <ContributionBar
            label="Color"
            percentage={breakdown.contributions.color}
            amount={formatAddition(breakdown.additions.color)}
            variant="color"
            multiplier={breakdown.colorMultiplier}
          />
        </div>
      </div>

      {/* Final Estimate */}
      <div className="border-t border-gray-600 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-300 uppercase">
            Estimated Total
          </span>
          <span className="text-xl font-bold text-accent">
            {formatPriceRange(breakdown.finalRange)} CAD
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Price Breakdown Preview Panel
 * Shows live calculation of how size, style, and color affect final price
 */
export default function PriceBreakdownPreview({
  sizes,
  styles,
  colors,
  defaultSizeId,
  defaultStyleId,
  defaultColorId,
}: PriceBreakdownPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedSize, setSelectedSize] = useState(defaultSizeId || (sizes[0]?.id ?? ''));
  const [selectedStyle, setSelectedStyle] = useState(defaultStyleId || (styles[0]?.id ?? ''));
  const [selectedColor, setSelectedColor] = useState(defaultColorId || (colors[0]?.id ?? ''));

  // Calculate breakdown whenever selections change
  const breakdown = useMemo(
    () => calculatePriceBreakdown(selectedSize, selectedStyle, selectedColor, sizes, styles, colors),
    [selectedSize, selectedStyle, selectedColor, sizes, styles, colors]
  );

  // Don't render if no data
  if (sizes.length === 0 || styles.length === 0 || colors.length === 0) {
    return null;
  }

  return (
    <div className="price-breakdown-panel admin-card mb-6">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors rounded-t-lg"
        aria-expanded={isOpen}
        aria-controls="price-breakdown-content"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h3 className="text-lg font-semibold">Price Preview</h3>
        </div>
        <span
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        id="price-breakdown-content"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Size Selector */}
            <div>
              <label htmlFor="preview-size" className="block text-sm font-medium text-gray-400 mb-1">
                Size
              </label>
              <select
                id="preview-size"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Style Selector */}
            <div>
              <label htmlFor="preview-style" className="block text-sm font-medium text-gray-400 mb-1">
                Style
              </label>
              <select
                id="preview-style"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label} (×{style.multiplier.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Color Selector */}
            <div>
              <label htmlFor="preview-color" className="block text-sm font-medium text-gray-400 mb-1">
                Color
              </label>
              <select
                id="preview-color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {colors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.label} (×{color.multiplier.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breakdown Display */}
          <BreakdownDisplay breakdown={breakdown} />

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-2">
            This preview shows how pricing changes affect estimated totals. Select different
            combinations to see the impact of each component.
          </p>
        </div>
      </div>
    </div>
  );
}
