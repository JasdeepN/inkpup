import pricingData from '../data/pricing.json';
import { getD1Binding, getSizeCategories, getStyles, getColorProfiles } from './db/d1';
import type { SizeCategory as D1SizeCategory, Style as D1Style, ColorProfile as D1ColorProfile } from '../types/cloudflare';

// Re-export price breakdown utilities for admin components
export {
  calculatePriceBreakdown,
  calculateContributions,
  formatPriceRange,
  formatAddition,
  type PriceBreakdown,
} from './pricing-breakdown';

export type SizeCategory = {
  id: string;
  label: string;
    flatRateRangeCAD?: number[];
    estimateRangeCAD?: number[];
  typicalHours?: number;
    typicalHoursRange?: number[];
  sessionCount?: number;
    sessionCountRange?: number[];
  description?: string;
};

export type Complexity = { id: string; label: string; multiplier: number };
export type Style = { id: string; label: string; multiplier: number; description?: string };

export type ColorProfile = { id: string; label: string; multiplier: number; description?: string };

export interface PricingDataShape {
  hourlyRateTypical: { min: number; max: number; note?: string };
  sizeCategories: SizeCategory[];
  complexityMultipliers: Complexity[];
  styles?: Style[];
  colorProfiles: ColorProfile[];
}

export const pricing: PricingDataShape = pricingData as PricingDataShape;

/**
 * Feature flag to enable/disable D1 pricing data
 * Set to 'true' to query D1, 'false' to use JSON fallback
 */
const ENABLE_D1_PRICING = process.env.ENABLE_D1_PRICING === 'true' || process.env.NODE_ENV === 'production';

/**
 * Convert D1 SizeCategory to legacy format for compatibility
 */
function convertD1SizeCategory(d1Size: D1SizeCategory): SizeCategory {
  return {
    id: d1Size.id,
    label: d1Size.label,
    flatRateRangeCAD: [d1Size.min_price, d1Size.max_price],
    description: d1Size.description || undefined,
  };
}

/**
 * Convert D1 Style to legacy format
 */
function convertD1Style(d1Style: D1Style): Style {
  return {
    id: d1Style.id,
    label: d1Style.label,
    multiplier: d1Style.multiplier,
    description: d1Style.description || undefined,
  };
}

/**
 * Convert D1 ColorProfile to legacy format
 */
function convertD1ColorProfile(d1Color: D1ColorProfile): ColorProfile {
  return {
    id: d1Color.id,
    label: d1Color.label,
    multiplier: d1Color.multiplier,
    description: d1Color.description || undefined,
  };
}

/**
 * Get pricing data from D1 or fall back to JSON
 * This function tries D1 first (if enabled), then falls back to JSON data
 */
export async function getPricingData(): Promise<PricingDataShape> {
  // If D1 disabled or unavailable, return JSON data immediately
  if (!ENABLE_D1_PRICING) {
    return pricing;
  }

  const db = getD1Binding();
  if (!db) {
    console.warn('[Pricing] D1 binding not available, falling back to JSON data');
    return pricing;
  }

  try {
    // Query D1 for all pricing data in parallel
    const [d1Sizes, d1Styles, d1Colors] = await Promise.all([
      getSizeCategories(db),
      getStyles(db),
      getColorProfiles(db),
    ]);

    // Convert D1 data to legacy format
    const sizeCategories = d1Sizes.map(convertD1SizeCategory);
    const styles = d1Styles.map(convertD1Style);
    const colorProfiles = d1Colors.map(convertD1ColorProfile);

    return {
      hourlyRateTypical: pricing.hourlyRateTypical, // Keep from JSON (not in DB yet)
      sizeCategories,
      complexityMultipliers: pricing.complexityMultipliers, // Legacy fallback
      styles,
      colorProfiles,
    };
  } catch (error) {
    console.error('[Pricing] Error fetching from D1, falling back to JSON:', error);
    return pricing;
  }
}

/**
 * Estimate a CAD price range for a tattoo given a size category, complexity multiplier, and optional color profile.
 * If a flat or estimate range exists we scale it by complexity × color multipliers.
 * Otherwise we derive using hours × midpoint hourly rate × multipliers.
 * @param sizeId - Size category identifier
 * @param complexityId - Complexity (or style) identifier. This function supports both legacy complexity IDs and the newer `styles` array via pricing.styles.
 * @param colorProfileId - Optional color profile identifier (defaults to monochrome/1.0)
 * @param pricingData - Optional pricing data object (defaults to static JSON import)
 */
export function estimatePriceRange(sizeId: string, complexityId: string, colorProfileId?: string, pricingData?: PricingDataShape) {
  const data = pricingData ?? pricing;
  const size = data.sizeCategories.find(s => s.id === sizeId);
  // Support new styles array (`pricing.styles`) while keeping the legacy complexityMultipliers for compatibility
  const style = (data as any).styles?.find((s: Style) => s.id === complexityId) || data.complexityMultipliers.find(c => c.id === complexityId) || { multiplier: 1 } as Complexity | Style;
  const colorProfile = colorProfileId ? data.colorProfiles.find(cp => cp.id === colorProfileId) : undefined;
  if (!size) return null;
  const styleMult = style.multiplier || 1;
  const colorMult = colorProfile?.multiplier || 1;
  const totalMult = styleMult * colorMult;
  
  const baseRange = size.flatRateRangeCAD || size.estimateRangeCAD;
  if (baseRange) {
    const [min, max] = baseRange;
    return [Math.round(min * totalMult), Math.round(max * totalMult)] as [number, number];
  }

  const hours = size.typicalHoursRange || (size.typicalHours ? [size.typicalHours, size.typicalHours] : undefined);
  if (hours) {
    const hourlyMid = (data.hourlyRateTypical.min + data.hourlyRateTypical.max) / 2;
    const [hMin, hMax] = hours;
    return [Math.round(hMin * hourlyMid * totalMult), Math.round(hMax * hourlyMid * totalMult)] as [number, number];
  }
  return null;
}

/** Human readable formatting */
export function formatRange(range: [number, number] | null) {
  if (!range) return 'N/A';
  const [min, max] = range;
  if (max >= 6000) return `$${min.toLocaleString()}+`;
  return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
}
