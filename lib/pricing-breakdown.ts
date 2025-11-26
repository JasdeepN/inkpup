/**
 * Price Breakdown Calculator
 * Calculates detailed price breakdowns showing how each pricing component
 * (size, style, color) contributes to the final estimated price.
 */

import type { SizeCategory, Style, ColorProfile } from '../types/cloudflare.d';

/**
 * Detailed price breakdown with contribution percentages
 */
export interface PriceBreakdown {
  // Size component
  sizeId: string;
  sizeLabel: string;
  baseRange: [number, number];

  // Style component
  styleId: string;
  styleLabel: string;
  styleMultiplier: number;

  // Color component
  colorId: string;
  colorLabel: string;
  colorMultiplier: number;

  // Final calculated range
  finalRange: [number, number];

  // Dollar amounts added by each component
  additions: {
    style: [number, number]; // Additional $ from style multiplier
    color: [number, number]; // Additional $ from color multiplier
  };

  // Contribution percentages (sum to 100%)
  contributions: {
    size: number;  // Base contribution percentage
    style: number; // Style multiplier contribution percentage
    color: number; // Color multiplier contribution percentage
  };
}

/**
 * Calculate a detailed price breakdown for a given size/style/color combination.
 * 
 * Formula:
 * - finalPrice = basePrice × styleMultiplier × colorMultiplier
 * - Each component's contribution is calculated as a percentage of the final price
 * 
 * @param sizeId - The ID of the size category
 * @param styleId - The ID of the style
 * @param colorId - The ID of the color profile
 * @param sizes - Array of available size categories
 * @param styles - Array of available styles
 * @param colors - Array of available color profiles
 * @returns PriceBreakdown object or null if any ID is invalid
 */
export function calculatePriceBreakdown(
  sizeId: string,
  styleId: string,
  colorId: string,
  sizes: SizeCategory[],
  styles: Style[],
  colors: ColorProfile[]
): PriceBreakdown | null {
  // Validate inputs
  if (!sizeId || !styleId || !colorId) {
    return null;
  }

  // Find the selected items
  const size = sizes.find(s => s.id === sizeId);
  const style = styles.find(s => s.id === styleId);
  const color = colors.find(c => c.id === colorId);

  // Return null if any item not found
  if (!size || !style || !color) {
    return null;
  }

  // Extract base price range from size
  const baseRange: [number, number] = [size.min_price, size.max_price];

  // Get multipliers (default to 1.0 if somehow missing)
  const styleMultiplier = style.multiplier || 1;
  const colorMultiplier = color.multiplier || 1;

  // Calculate final price range
  const totalMultiplier = styleMultiplier * colorMultiplier;
  const finalRange: [number, number] = [
    Math.round(baseRange[0] * totalMultiplier),
    Math.round(baseRange[1] * totalMultiplier),
  ];

  // Calculate dollar additions from each multiplier
  // Style addition = base × (styleMultiplier - 1)
  const styleAddition: [number, number] = [
    Math.round(baseRange[0] * (styleMultiplier - 1)),
    Math.round(baseRange[1] * (styleMultiplier - 1)),
  ];

  // Color addition = (base × styleMultiplier) × (colorMultiplier - 1)
  const afterStyle: [number, number] = [
    baseRange[0] * styleMultiplier,
    baseRange[1] * styleMultiplier,
  ];
  const colorAddition: [number, number] = [
    Math.round(afterStyle[0] * (colorMultiplier - 1)),
    Math.round(afterStyle[1] * (colorMultiplier - 1)),
  ];

  // Calculate contribution percentages
  // These represent what portion of the final price each component accounts for
  const contributions = calculateContributions(styleMultiplier, colorMultiplier);

  return {
    sizeId: size.id,
    sizeLabel: size.label,
    baseRange,

    styleId: style.id,
    styleLabel: style.label,
    styleMultiplier,

    colorId: color.id,
    colorLabel: color.label,
    colorMultiplier,

    finalRange,

    additions: {
      style: styleAddition,
      color: colorAddition,
    },

    contributions,
  };
}

/**
 * Calculate the percentage contribution of each pricing component.
 * 
 * The formula breaks down the final price into components:
 * - Base contributes: 1 / (style × color) of the final price
 * - Style contributes: (style - 1) / (style × color) of the final price
 * - Color contributes: (color - 1) × style / (style × color) of the final price
 * 
 * All percentages sum to 100%.
 * 
 * @param styleMultiplier - Style multiplier (e.g., 1.2)
 * @param colorMultiplier - Color multiplier (e.g., 1.15)
 * @returns Object with size, style, and color contribution percentages
 */
export function calculateContributions(
  styleMultiplier: number,
  colorMultiplier: number
): { size: number; style: number; color: number } {
  const totalMultiplier = styleMultiplier * colorMultiplier;

  // Handle edge case where multipliers are both 1.0
  if (totalMultiplier === 1) {
    return { size: 100, style: 0, color: 0 };
  }

  // Base contribution: what percentage of final price is the original base
  const sizeContribution = (1 / totalMultiplier) * 100;

  // Style contribution: additional percentage from style multiplier
  // This is (styleMultiplier - 1) / totalMultiplier
  const styleContribution = ((styleMultiplier - 1) / totalMultiplier) * 100;

  // Color contribution: additional percentage from color multiplier
  // This is ((colorMultiplier - 1) × styleMultiplier) / totalMultiplier
  const colorContribution = (((colorMultiplier - 1) * styleMultiplier) / totalMultiplier) * 100;

  // Round to 1 decimal place
  return {
    size: Math.round(sizeContribution * 10) / 10,
    style: Math.round(styleContribution * 10) / 10,
    color: Math.round(colorContribution * 10) / 10,
  };
}

/**
 * Format a price range as a human-readable string
 * @param range - Tuple of [min, max] prices
 * @returns Formatted string like "$150 - $200"
 */
export function formatPriceRange(range: [number, number]): string {
  const [min, max] = range;
  if (min === max) {
    return `$${min}`;
  }
  return `$${min} - $${max}`;
}

/**
 * Format an addition amount (can be positive or zero)
 * @param range - Tuple of [min, max] additions
 * @returns Formatted string like "+$30 - $40" or "$0"
 */
export function formatAddition(range: [number, number]): string {
  const [min, max] = range;
  if (min === 0 && max === 0) {
    return '$0';
  }
  if (min === max) {
    return `+$${min}`;
  }
  return `+$${min} - $${max}`;
}
