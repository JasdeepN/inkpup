/**
 * Integration tests for PriceBreakdownPreview component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PriceBreakdownPreview from './PriceBreakdownPreview';
import type { SizeCategory, Style, ColorProfile } from '../../types/cloudflare.d';

// Mock data
const mockSizes: SizeCategory[] = [
  { id: 'small', label: 'Small (1-2")', min_price: 150, max_price: 200, description: null, sort_order: 1 },
  { id: 'medium', label: 'Medium (3-4")', min_price: 250, max_price: 400, description: null, sort_order: 2 },
];

const mockStyles: Style[] = [
  { id: 'simple', label: 'Simple Line', multiplier: 1.0, description: null, recommended_color_type: null, sort_order: 1 },
  { id: 'traditional', label: 'Traditional', multiplier: 1.2, description: null, recommended_color_type: null, sort_order: 2 },
];

const mockColors: ColorProfile[] = [
  { id: 'mono', label: 'Monochrome', multiplier: 1.0, description: null, sort_order: 1 },
  { id: 'color', label: 'Full Color', multiplier: 1.15, description: null, sort_order: 2 },
];

describe('PriceBreakdownPreview', () => {
  describe('rendering', () => {
    it('should render the preview panel with title', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(screen.getByText('Price Preview')).toBeInTheDocument();
    });

    it('should render all three selector dropdowns', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(screen.getByLabelText('Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Style')).toBeInTheDocument();
      expect(screen.getByLabelText('Color')).toBeInTheDocument();
    });

    it('should render size options in dropdown', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const sizeSelect = screen.getByLabelText('Size') as HTMLSelectElement;
      expect(sizeSelect).toBeInTheDocument();

      // Check options exist
      const options = Array.from(sizeSelect.options);
      expect(options.some(opt => opt.text.includes('Small'))).toBe(true);
      expect(options.some(opt => opt.text.includes('Medium'))).toBe(true);
    });

    it('should render style options with multipliers', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const styleSelect = screen.getByLabelText('Style') as HTMLSelectElement;
      const options = Array.from(styleSelect.options);

      // Check that multipliers are shown
      expect(options.some(opt => opt.text.includes('(×1.00)'))).toBe(true);
      expect(options.some(opt => opt.text.includes('(×1.20)'))).toBe(true);
    });

    it('should render color options with multipliers', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const colorSelect = screen.getByLabelText('Color') as HTMLSelectElement;
      const options = Array.from(colorSelect.options);

      expect(options.some(opt => opt.text.includes('Monochrome'))).toBe(true);
      expect(options.some(opt => opt.text.includes('Full Color'))).toBe(true);
    });
  });

  describe('default selections', () => {
    it('should select first items by default when no defaults provided', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const sizeSelect = screen.getByLabelText('Size') as HTMLSelectElement;
      const styleSelect = screen.getByLabelText('Style') as HTMLSelectElement;
      const colorSelect = screen.getByLabelText('Color') as HTMLSelectElement;

      expect(sizeSelect.value).toBe('small');
      expect(styleSelect.value).toBe('simple');
      expect(colorSelect.value).toBe('mono');
    });

    it('should use provided default values', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
          defaultSizeId="medium"
          defaultStyleId="traditional"
          defaultColorId="color"
        />
      );

      const sizeSelect = screen.getByLabelText('Size') as HTMLSelectElement;
      const styleSelect = screen.getByLabelText('Style') as HTMLSelectElement;
      const colorSelect = screen.getByLabelText('Color') as HTMLSelectElement;

      expect(sizeSelect.value).toBe('medium');
      expect(styleSelect.value).toBe('traditional');
      expect(colorSelect.value).toBe('color');
    });
  });

  describe('breakdown display', () => {
    it('should show breakdown section labels', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(screen.getByText('Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Base Price')).toBeInTheDocument();
      expect(screen.getByText('Estimated Total')).toBeInTheDocument();
    });

    it('should display base price range', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      // Default selection is small (150-200) with no multipliers
      expect(screen.getByText('$150 - $200')).toBeInTheDocument();
    });

    it('should show CAD currency label', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(screen.getByText(/CAD/)).toBeInTheDocument();
    });
  });

  describe('selection interactions', () => {
    it('should update breakdown when size changes', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const sizeSelect = screen.getByLabelText('Size') as HTMLSelectElement;

      // Change to medium size
      fireEvent.change(sizeSelect, { target: { value: 'medium' } });

      // Should now show medium base price (250-400)
      expect(screen.getByText('$250 - $400')).toBeInTheDocument();
    });

    it('should update final estimate when style changes', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const styleSelect = screen.getByLabelText('Style') as HTMLSelectElement;

      // Change to traditional style (1.2 multiplier)
      fireEvent.change(styleSelect, { target: { value: 'traditional' } });

      // small (150-200) × traditional (1.2) = 180-240
      expect(screen.getByText('$180 - $240 CAD')).toBeInTheDocument();
    });

    it('should update final estimate when color changes', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const colorSelect = screen.getByLabelText('Color') as HTMLSelectElement;

      // Change to full color (1.15 multiplier)
      fireEvent.change(colorSelect, { target: { value: 'color' } });

      // small (150-200) × simple (1.0) × color (1.15) = 173-230
      expect(screen.getByText('$173 - $230 CAD')).toBeInTheDocument();
    });
  });

  describe('collapsible functionality', () => {
    it('should have collapse button with aria-expanded', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const collapseButton = screen.getByRole('button', { name: /Price Preview/i });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should toggle expanded state on click', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const collapseButton = screen.getByRole('button', { name: /Price Preview/i });

      // Initially expanded
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(collapseButton);
      expect(collapseButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(collapseButton);
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls attribute', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      const collapseButton = screen.getByRole('button', { name: /Price Preview/i });
      expect(collapseButton).toHaveAttribute('aria-controls', 'price-breakdown-content');
    });
  });

  describe('empty data handling', () => {
    it('should not render when sizes array is empty', () => {
      const { container } = render(
        <PriceBreakdownPreview
          sizes={[]}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when styles array is empty', () => {
      const { container } = render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={[]}
          colors={mockColors}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when colors array is empty', () => {
      const { container } = render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={[]}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have labels associated with selectors', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      // Labels should be properly associated via htmlFor
      const sizeSelect = screen.getByLabelText('Size');
      const styleSelect = screen.getByLabelText('Style');
      const colorSelect = screen.getByLabelText('Color');

      expect(sizeSelect).toHaveAttribute('id', 'preview-size');
      expect(styleSelect).toHaveAttribute('id', 'preview-style');
      expect(colorSelect).toHaveAttribute('id', 'preview-color');
    });

    it('should have help text', () => {
      render(
        <PriceBreakdownPreview
          sizes={mockSizes}
          styles={mockStyles}
          colors={mockColors}
        />
      );

      expect(screen.getByText(/This preview shows how pricing changes affect/)).toBeInTheDocument();
    });
  });
});
