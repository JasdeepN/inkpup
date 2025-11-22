import pricingData from '../data/pricing.json';

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
 * Estimate a CAD price range for a tattoo given a size category, complexity multiplier, and optional color profile.
 * If a flat or estimate range exists we scale it by complexity × color multipliers.
 * Otherwise we derive using hours × midpoint hourly rate × multipliers.
 * @param sizeId - Size category identifier
 * @param complexityId - Complexity (or style) identifier. This function supports both legacy complexity IDs and the newer `styles` array via pricing.styles.
 * @param colorProfileId - Optional color profile identifier (defaults to monochrome/1.0)
 */
export function estimatePriceRange(sizeId: string, complexityId: string, colorProfileId?: string) {
  const size = pricing.sizeCategories.find(s => s.id === sizeId);
  // Support new styles array (`pricing.styles`) while keeping the legacy complexityMultipliers for compatibility
  const style = (pricing as any).styles?.find((s: Style) => s.id === complexityId) || pricing.complexityMultipliers.find(c => c.id === complexityId) || { multiplier: 1 } as Complexity | Style;
  const colorProfile = colorProfileId ? pricing.colorProfiles.find(cp => cp.id === colorProfileId) : undefined;
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
    const hourlyMid = (pricing.hourlyRateTypical.min + pricing.hourlyRateTypical.max) / 2;
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
