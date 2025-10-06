import { isGalleryCaptionsEnabled, isCalendlyBookingEnabled } from './featureFlags';

describe('featureFlags', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  test('isGalleryCaptionsEnabled returns true only when env var is "true"', () => {
    delete process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS;
    expect(isGalleryCaptionsEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS = 'false';
    expect(isGalleryCaptionsEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS = 'true';
    expect(isGalleryCaptionsEnabled()).toBe(true);
  });

  test('isCalendlyBookingEnabled returns true only when env var is "true"', () => {
    delete process.env.NEXT_PUBLIC_SHOW_CALENDLY_BOOKING;
    expect(isCalendlyBookingEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_SHOW_CALENDLY_BOOKING = 'true';
    expect(isCalendlyBookingEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_SHOW_CALENDLY_BOOKING = '0';
    expect(isCalendlyBookingEnabled()).toBe(false);
  });
});
