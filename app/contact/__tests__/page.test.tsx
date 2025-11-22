import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ContactPage from '../page';

// Mock next/navigation useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock feature flag used by the page
jest.mock('../../../lib/featureFlags', () => ({
  isCalendlyBookingEnabled: () => false,
}));

const mockUseSearchParams = require('next/navigation').useSearchParams as jest.Mock;

describe('Contact Page - dynamic form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no query params
    mockUseSearchParams.mockReturnValue({ get: (k: string) => null });
  });

  test('renders default contact form and message fields', () => {
    render(<ContactPage />);

    // Default radio:
    const messageRadio = screen.getByRole('radio', { name: /send a message/i });
    expect(messageRadio).toBeChecked();

    // Core fields present
    expect(screen.getByTestId('contact-name')).toBeInTheDocument();
    expect(screen.getByTestId('contact-email')).toBeInTheDocument();
    expect(screen.getByTestId('contact-message')).toBeInTheDocument();

    // No flash or custom fields
    expect(screen.queryByTestId('contact-placement')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-concept')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contact-placement-size')).not.toBeInTheDocument();

    // Hidden booking_type set to 'contact'
    const bookingInput = document.querySelector('input[name="booking_type"]') as HTMLInputElement;
    expect(bookingInput).toBeTruthy();
    expect(bookingInput.value).toBe('contact');

    // Submit button text is 'Send'
    expect(screen.getByTestId('contact-submit')).toHaveTextContent('Send');
  });

  test('preselects flash form when design query param present', () => {
    mockUseSearchParams.mockReturnValue({ get: (k: string) => (k === 'design' ? 'flash-3' : null) });

    render(<ContactPage />);

    // Radio: flash selected
    expect(screen.getByRole('radio', { name: /book a flash design/i })).toBeChecked();

    // Flash-only field present
    expect(screen.getByTestId('contact-placement')).toBeInTheDocument();

    // Hidden fields
    const bookingInput = document.querySelector('input[name="booking_type"]') as HTMLInputElement;
    const designInput = document.querySelector('input[name="design_id"]') as HTMLInputElement;

    expect(bookingInput.value).toBe('flash');
    expect(designInput.value).toBe('flash-3');

    // Submit button changes
    expect(screen.getByTestId('contact-submit')).toHaveTextContent('Request Booking');
  });

  test('preselects custom form when type=custom query param present', () => {
    mockUseSearchParams.mockReturnValue({ get: (k: string) => (k === 'type' ? 'custom' : null) });

    render(<ContactPage />);

    // Radio: custom selected
    expect(screen.getByRole('radio', { name: /request custom consultation/i })).toBeChecked();

    // Custom fields present
    expect(screen.getByTestId('contact-concept')).toBeInTheDocument();
    expect(screen.getByTestId('contact-placement-size')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /budget/i }) || screen.getByRole('combobox')).toBeTruthy();

    // Submit button changes
    expect(screen.getByTestId('contact-submit')).toHaveTextContent('Submit Consultation Request');
  });

  test('updates fields when selecting different form mode via radio', async () => {
    render(<ContactPage />);

    const user = userEvent.setup();

    // Start default contact
    expect(screen.getByRole('radio', { name: /send a message/i })).toBeChecked();

    // Click custom
    await user.click(screen.getByRole('radio', { name: /request custom consultation/i }));
    expect(screen.getByRole('radio', { name: /request custom consultation/i })).toBeChecked();
    expect(screen.getByTestId('contact-concept')).toBeInTheDocument();
    expect((document.querySelector('input[name="booking_type"]') as HTMLInputElement).value).toBe('custom');
    expect(screen.getByTestId('contact-submit')).toHaveTextContent('Submit Consultation Request');

    // Click flash
    await user.click(screen.getByRole('radio', { name: /book a flash design/i }));
    expect(screen.getByRole('radio', { name: /book a flash design/i })).toBeChecked();
    expect(screen.getByTestId('contact-placement')).toBeInTheDocument();
    expect((document.querySelector('input[name="booking_type"]') as HTMLInputElement).value).toBe('flash');
    expect(screen.getByTestId('contact-submit')).toHaveTextContent('Request Booking');
  });
});
