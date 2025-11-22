import { estimatePriceRange, formatRange } from './pricing';

describe('pricing estimator', () => {
  it('scales flat rate range by complexity multiplier', () => {
    const base = estimatePriceRange('micro', 'minimal_line');
    expect(base).toEqual([100, 200]);
    const realism = estimatePriceRange('micro', 'realism_portrait');
    expect(realism).toEqual([140, 280]); // 1.4x
  });

  it('handles estimate range categories', () => {
    const mediumSimple = estimatePriceRange('medium', 'minimal_line');
    expect(mediumSimple).toEqual([500, 800]);
    // full_color multiplier 1.25
    const mediumColor = estimatePriceRange('medium', 'minimal_line', 'full_color');
    expect(mediumColor).toEqual([625, 1000]); // 1.25x
  });

  it('formats range with upper bound plus when very large', () => {
    const major = estimatePriceRange('major_project', 'realism_portrait');
    expect(formatRange(major)).toMatch(/\$/);
  });

  it('returns null for unknown size', () => {
    expect(estimatePriceRange('unknown', 'minimal_line')).toBeNull();
  });

  describe('color profile multipliers', () => {
    it('defaults to monochrome multiplier 1.0 when no color profile specified', () => {
      const base = estimatePriceRange('small', 'black_grey_shaded');
      const baseWithExplicitMono = estimatePriceRange('small', 'black_grey_shaded', 'monochrome_black_grey');
      expect(base).toEqual(baseWithExplicitMono);
    });

    it('stacks complexity and color multipliers', () => {
      // Small: flatRateRangeCAD [150, 300]
      // black_grey_shaded: 1.15
      // full_color: 1.25
      // Total: 1.15 * 1.25 = 1.4375
      const range = estimatePriceRange('small', 'black_grey_shaded', 'full_color');
      expect(range).toEqual([Math.round(150 * 1.4375), Math.round(300 * 1.4375)]);
      expect(range).toEqual([216, 431]);
    });

    it('applies hyper color realism multiplier for high-end projects', () => {
      // medium: estimateRangeCAD [500, 800]
      // realism_portrait: 1.4
      // hyper_color_realism: 1.35
      // Total: 1.4 * 1.35 = 1.89
      const range = estimatePriceRange('medium', 'realism_portrait', 'hyper_color_realism');
      expect(range).toEqual([Math.round(500 * 1.89), Math.round(800 * 1.89)]);
      expect(range).toEqual([945, 1512]);
    });

    it('handles limited palette with minimal uplift', () => {
      // small_detailed: flatRateRangeCAD [300, 450]
      // fine_line: 1.08 (updated)
      // limited_palette: 1.12
      // Total: 1.08 * 1.12 = 1.2096
      const range = estimatePriceRange('small_detailed', 'fine_line', 'limited_palette');
      expect(range).toEqual([Math.round(300 * 1.2096), Math.round(450 * 1.2096)]);
      expect(range).toEqual([363, 544]);
    });

    it('handles unknown color profile gracefully with fallback to 1.0', () => {
      const range = estimatePriceRange('micro', 'minimal_line', 'unknown_color');
      expect(range).toEqual([100, 200]); // Same as baseline
    });

    it('validates all defined color profiles exist and have multipliers', () => {
      const range1 = estimatePriceRange('micro', 'minimal_line', 'monochrome_black_grey');
      const range2 = estimatePriceRange('micro', 'minimal_line', 'limited_palette');
      const range3 = estimatePriceRange('micro', 'minimal_line', 'full_color');
      const range4 = estimatePriceRange('micro', 'minimal_line', 'hyper_color_realism');
      
      expect(range1).toEqual([100, 200]);
      expect(range2).toEqual([112, 224]);
      expect(range3).toEqual([125, 250]);
      expect(range4).toEqual([135, 270]);
    });
  });
});
