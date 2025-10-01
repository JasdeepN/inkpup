import React from 'react';
import { render } from '@testing-library/react';
import LocalBusinessJsonLd from './LocalBusinessJsonLd';

test('LocalBusinessJsonLd renders valid JSON-LD', () => {
  const { container } = render(
    <LocalBusinessJsonLd
      name="InkPup Tattoos"
      url="https://www.inkpup.ca"
      phone="(555) 555-5555"
      street="1275 Finch Ave W unit 111"
      city="North York"
      region="ON"
      postalCode="M3J 0L5"
      openingHours={["By appointment only - DM always open"]}
    />
  );

  const script = container.querySelector('[data-testid="json-ld"]');
  expect(script).toBeTruthy();
  const parsed = JSON.parse(script?.textContent || '{}');
  expect(parsed['@type']).toBe('TattooParlor');
  expect(parsed.name).toBe('InkPup Tattoos');
  expect(parsed.openingHours).toEqual(["By appointment only - DM always open"]);
});

test('LocalBusinessJsonLd includes geo coordinates when provided', () => {
  const { container } = render(
    <LocalBusinessJsonLd
      name="InkPup Tattoos"
      url="https://www.inkpup.ca"
      street="1275 Finch Ave W unit 111"
      city="North York"
      region="ON"
      postalCode="M3J 0L5"
      latitude={43.7615}
      longitude={-79.4111}
    />
  );

  const script = container.querySelector('[data-testid="json-ld"]');
  expect(script).toBeTruthy();
  const parsed = JSON.parse(script?.textContent || '{}');
  expect(parsed.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 43.7615, longitude: -79.4111 });
  expect(parsed).not.toHaveProperty('openingHours');
  expect(parsed).not.toHaveProperty('telephone');
});
