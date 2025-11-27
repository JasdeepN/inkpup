import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingEstimator from './PricingEstimator';
import { estimatePriceRange, formatRange, type PricingDataShape } from '@/lib/pricing';

describe('PricingEstimator UI', () => {
  it('shows style and color toggles and updates estimate accordingly', async () => {
    render(<PricingEstimator />);
    const sizeSelect = screen.getByLabelText(/Size Category/i) as HTMLSelectElement;
    const styleSelect = screen.getByLabelText(/Style/i) as HTMLSelectElement;
    const colorRadio = screen.getByLabelText(/Color$/i) as HTMLInputElement; // exact match for Color radio label
    const colorProfileSelect = screen.getByLabelText(/Color Profile/i) as HTMLSelectElement;

    // Set size and style
    await userEvent.selectOptions(sizeSelect, 'micro');
    await userEvent.selectOptions(styleSelect, 'realism_portrait');
    expect(screen.getByText(/Photorealistic shading and color depth/i)).toBeInTheDocument();

    // Toggle to color options and pick full_color
    await userEvent.click(colorRadio);
    await userEvent.selectOptions(colorProfileSelect, 'full_color');

    // The estimate should update accordingly
    const estimateEl = await screen.findByTestId('pricing-estimate');
    const expected = formatRange(estimatePriceRange('micro', 'realism_portrait', 'full_color'));
    expect(estimateEl.textContent).toBe(expected);
  });
});

describe('PricingEstimator with initialData prop', () => {
  const customPricing: PricingDataShape = {
    hourlyRateTypical: { min: 150, max: 200 },
    sizeCategories: [
      { id: 'tiny', label: 'Tiny Test', flatRateRangeCAD: [50, 100] },
      { id: 'big', label: 'Big Test', flatRateRangeCAD: [500, 1000] },
    ],
    complexityMultipliers: [
      { id: 'simple', label: 'Simple', multiplier: 1.0 },
    ],
    styles: [
      { id: 'test_style', label: 'Test Style', multiplier: 1.0, description: 'A test style' },
      { id: 'fancy_style', label: 'Fancy Style', multiplier: 2.0, description: 'Double price' },
    ],
    colorProfiles: [
      { id: 'monochrome_black_grey', label: 'Black & Grey', multiplier: 1.0 },
      { id: 'test_color', label: 'Test Color', multiplier: 1.5 },
    ],
  };

  it('renders custom size categories from initialData', () => {
    render(<PricingEstimator initialData={customPricing} />);
    
    const sizeSelect = screen.getByLabelText(/Size Category/i) as HTMLSelectElement;
    expect(sizeSelect).toBeInTheDocument();
    
    // Check custom options are present
    expect(screen.getByRole('option', { name: 'Tiny Test' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Big Test' })).toBeInTheDocument();
  });

  it('renders custom styles from initialData', () => {
    render(<PricingEstimator initialData={customPricing} />);
    
    const styleSelect = screen.getByLabelText(/Style/i) as HTMLSelectElement;
    expect(styleSelect).toBeInTheDocument();
    
    expect(screen.getByRole('option', { name: 'Test Style' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fancy Style' })).toBeInTheDocument();
  });

  it('calculates price using custom initialData', async () => {
    render(<PricingEstimator initialData={customPricing} />);
    
    const sizeSelect = screen.getByLabelText(/Size Category/i) as HTMLSelectElement;
    const styleSelect = screen.getByLabelText(/Style/i) as HTMLSelectElement;

    await userEvent.selectOptions(sizeSelect, 'tiny');
    await userEvent.selectOptions(styleSelect, 'test_style');

    const estimateEl = await screen.findByTestId('pricing-estimate');
    // tiny: [50, 100], test_style: 1.0x, mono: 1.0x = $50–$100
    expect(estimateEl.textContent).toBe('$50–$100');
  });

  it('applies custom style multiplier from initialData', async () => {
    render(<PricingEstimator initialData={customPricing} />);
    
    const sizeSelect = screen.getByLabelText(/Size Category/i) as HTMLSelectElement;
    const styleSelect = screen.getByLabelText(/Style/i) as HTMLSelectElement;

    await userEvent.selectOptions(sizeSelect, 'tiny');
    await userEvent.selectOptions(styleSelect, 'fancy_style');

    const estimateEl = await screen.findByTestId('pricing-estimate');
    // tiny: [50, 100], fancy_style: 2.0x = $100–$200
    expect(estimateEl.textContent).toBe('$100–$200');
  });

  it('falls back to default pricing when initialData is undefined', () => {
    render(<PricingEstimator initialData={undefined} />);
    
    // Should render default size categories (micro, small, etc.)
    expect(screen.getByRole('option', { name: /Micro/i })).toBeInTheDocument();
  });
});
