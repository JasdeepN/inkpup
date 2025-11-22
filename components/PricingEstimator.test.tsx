import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingEstimator from './PricingEstimator';
import { estimatePriceRange, formatRange } from '../lib/pricing';

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
