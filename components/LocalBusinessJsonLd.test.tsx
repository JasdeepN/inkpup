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

  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).toBeTruthy();
  const parsed = JSON.parse(script.textContent || '{}');
  expect(parsed['@type']).toBe('TattooParlor');
  expect(parsed.name).toBe('InkPup Tattoos');
});
