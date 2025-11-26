/**
 * Unit tests for price breakdown calculation utilities
 */

import {
  calculatePriceBreakdown,
  calculateContributions,
  formatPriceRange,
  formatAddition,
} from './pricing-breakdown';
import type { SizeCategory, Style, ColorProfile } from '../types/cloudflare.d';

// Mock data for testing
const mockSizes: SizeCategory[] = [
  { id: 'small', label: 'Small (1-2")', min_price: 150, max_price: 200, description: null, sort_order: 1 },
  { id: 'medium', label: 'Medium (3-4")', min_price: 250, max_price: 400, description: null, sort_order: 2 },
  { id: 'large', label: 'Large (5-7")', min_price: 400, max_price: 700, description: null, sort_order: 3 },
];

const mockStyles: Style[] = [
  { id: 'simple', label: 'Simple Line', multiplier: 1.0, description: null, recommended_color_type: null, sort_order: 1 },
  { id: 'traditional', label: 'Traditional', multiplier: 1.2, description: null, recommended_color_type: null, sort_order: 2 },
  { id: 'realism', label: 'Realism', multiplier: 2.0, description: null, recommended_color_type: null, sort_order: 3 },
];

const mockColors: ColorProfile[] = [
  { id: 'mono', label: 'Monochrome', multiplier: 1.0, description: null, sort_order: 1 },
  { id: 'color', label: 'Full Color', multiplier: 1.15, description: null, sort_order: 2 },
  { id: 'vibrant', label: 'Vibrant Palette', multiplier: 1.5, description: null, sort_order: 3 },
];

describe('calculatePriceBreakdown', () => {
  describe('happy path', () => {
    it('should return correct breakdown for valid inputs', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'color', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.sizeId).toBe('small');
      expect(result!.sizeLabel).toBe('Small (1-2")');
      expect(result!.baseRange).toEqual([150, 200]);
      expect(result!.styleId).toBe('traditional');
      expect(result!.styleLabel).toBe('Traditional');
      expect(result!.styleMultiplier).toBe(1.2);
      expect(result!.colorId).toBe('color');
      expect(result!.colorLabel).toBe('Full Color');
      expect(result!.colorMultiplier).toBe(1.15);
    });

    it('should calculate correct final range with multipliers', () => {
      // small (150-200) × traditional (1.2) × full color (1.15) = 207-276
      const result = calculatePriceBreakdown('small', 'traditional', 'color', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.finalRange[0]).toBe(207); // 150 × 1.2 × 1.15 = 207
      expect(result!.finalRange[1]).toBe(276); // 200 × 1.2 × 1.15 = 276
    });

    it('should calculate correct additions for style and color', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'color', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      // Style addition = base × (style - 1) = 150/200 × 0.2 = 30/40
      expect(result!.additions.style).toEqual([30, 40]);
      // Color addition = (base × style) × (color - 1) = 180/240 × 0.15 = 27/36
      expect(result!.additions.color).toEqual([27, 36]);
    });
  });

  describe('base-only case (multipliers = 1.0)', () => {
    it('should return 100% size contribution when both multipliers are 1.0', () => {
      const result = calculatePriceBreakdown('small', 'simple', 'mono', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.contributions.size).toBe(100);
      expect(result!.contributions.style).toBe(0);
      expect(result!.contributions.color).toBe(0);
    });

    it('should have final range equal to base range', () => {
      const result = calculatePriceBreakdown('small', 'simple', 'mono', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.finalRange).toEqual([150, 200]);
      expect(result!.additions.style).toEqual([0, 0]);
      expect(result!.additions.color).toEqual([0, 0]);
    });
  });

  describe('high multipliers', () => {
    it('should calculate correctly with high multipliers (realism × vibrant)', () => {
      // medium (250-400) × realism (2.0) × vibrant (1.5) = 750-1200
      const result = calculatePriceBreakdown('medium', 'realism', 'vibrant', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.finalRange[0]).toBe(750);  // 250 × 2.0 × 1.5
      expect(result!.finalRange[1]).toBe(1200); // 400 × 2.0 × 1.5
    });

    it('should have size contribution under 50% with high multipliers', () => {
      const result = calculatePriceBreakdown('medium', 'realism', 'vibrant', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      // Base contribution = 1 / (2.0 × 1.5) = 1/3 ≈ 33.3%
      expect(result!.contributions.size).toBeCloseTo(33.3, 0);
    });
  });

  describe('style-only multiplier', () => {
    it('should calculate correctly when only style has multiplier', () => {
      // small (150-200) × traditional (1.2) × mono (1.0) = 180-240
      const result = calculatePriceBreakdown('small', 'traditional', 'mono', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.finalRange).toEqual([180, 240]);
      expect(result!.contributions.color).toBe(0);
      expect(result!.contributions.style).toBeGreaterThan(0);
    });
  });

  describe('color-only multiplier', () => {
    it('should calculate correctly when only color has multiplier', () => {
      // small (150-200) × simple (1.0) × color (1.15) = 172.5-230 → 173-230
      const result = calculatePriceBreakdown('small', 'simple', 'color', mockSizes, mockStyles, mockColors);

      expect(result).not.toBeNull();
      expect(result!.finalRange).toEqual([173, 230]); // Rounded
      expect(result!.contributions.style).toBe(0);
      expect(result!.contributions.color).toBeGreaterThan(0);
    });
  });

  describe('invalid inputs', () => {
    it('should return null for missing size ID', () => {
      const result = calculatePriceBreakdown('nonexistent', 'traditional', 'color', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null for missing style ID', () => {
      const result = calculatePriceBreakdown('small', 'nonexistent', 'color', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null for missing color ID', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'nonexistent', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null for empty size ID', () => {
      const result = calculatePriceBreakdown('', 'traditional', 'color', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null for empty style ID', () => {
      const result = calculatePriceBreakdown('small', '', 'color', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null for empty color ID', () => {
      const result = calculatePriceBreakdown('small', 'traditional', '', mockSizes, mockStyles, mockColors);
      expect(result).toBeNull();
    });
  });

  describe('empty arrays', () => {
    it('should return null when sizes array is empty', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'color', [], mockStyles, mockColors);
      expect(result).toBeNull();
    });

    it('should return null when styles array is empty', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'color', mockSizes, [], mockColors);
      expect(result).toBeNull();
    });

    it('should return null when colors array is empty', () => {
      const result = calculatePriceBreakdown('small', 'traditional', 'color', mockSizes, mockStyles, []);
      expect(result).toBeNull();
    });
  });
});

describe('calculateContributions', () => {
  it('should return 100% size when both multipliers are 1.0', () => {
    const result = calculateContributions(1.0, 1.0);
    expect(result).toEqual({ size: 100, style: 0, color: 0 });
  });

  it('should calculate correct contributions for typical multipliers', () => {
    // style=1.2, color=1.15, total=1.38
    // size = 1/1.38 = 72.5%
    // style = 0.2/1.38 = 14.5%
    // color = 0.15×1.2/1.38 = 13.0%
    const result = calculateContributions(1.2, 1.15);
    expect(result.size).toBeCloseTo(72.5, 0);
    expect(result.style).toBeCloseTo(14.5, 0);
    expect(result.color).toBeCloseTo(13.0, 0);
  });

  it('should have contributions that sum to approximately 100%', () => {
    const result = calculateContributions(1.5, 1.3);
    const total = result.size + result.style + result.color;
    expect(total).toBeCloseTo(100, 0);
  });

  it('should handle style-only multiplier', () => {
    const result = calculateContributions(1.5, 1.0);
    expect(result.size).toBeCloseTo(66.7, 0);
    expect(result.style).toBeCloseTo(33.3, 0);
    expect(result.color).toBe(0);
  });

  it('should handle color-only multiplier', () => {
    const result = calculateContributions(1.0, 1.5);
    expect(result.size).toBeCloseTo(66.7, 0);
    expect(result.style).toBe(0);
    expect(result.color).toBeCloseTo(33.3, 0);
  });

  it('should handle very high multipliers', () => {
    const result = calculateContributions(3.0, 2.0);
    // total = 6.0, size = 1/6 = 16.7%, style = 2/6 = 33.3%, color = 1×3/6 = 50%
    expect(result.size).toBeCloseTo(16.7, 0);
    expect(result.style).toBeCloseTo(33.3, 0);
    expect(result.color).toBeCloseTo(50, 0);
  });
});

describe('formatPriceRange', () => {
  it('should format a range correctly', () => {
    expect(formatPriceRange([150, 200])).toBe('$150 - $200');
  });

  it('should format equal values as single price', () => {
    expect(formatPriceRange([100, 100])).toBe('$100');
  });

  it('should handle large numbers', () => {
    expect(formatPriceRange([1000, 1500])).toBe('$1000 - $1500');
  });
});

describe('formatAddition', () => {
  it('should format a positive addition correctly', () => {
    expect(formatAddition([30, 40])).toBe('+$30 - $40');
  });

  it('should format equal additions as single value', () => {
    expect(formatAddition([25, 25])).toBe('+$25');
  });

  it('should format zero additions', () => {
    expect(formatAddition([0, 0])).toBe('$0');
  });
});
