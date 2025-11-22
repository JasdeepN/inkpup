import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

test('Hero renders heading, both pathway cards, and hero image when provided', () => {
  const heroImage = {
    src: 'https://example.com/hero.webp',
    alt: 'Featured tattoo piece',
  };

  render(<Hero heroImage={heroImage} />);

  // Heading present
  expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();

  // Pathway cards container
  expect(screen.getByTestId('hero-paths')).toBeTruthy();
  expect(screen.getByTestId('hero-path-flash')).toBeTruthy();
  expect(screen.getByTestId('hero-path-custom')).toBeTruthy();

  // Flash & Custom CTA links
  expect(screen.getByRole('link', { name: /browse flash/i })).toBeTruthy();
  expect(screen.getByRole('link', { name: /request custom design/i })).toBeTruthy();

  // Hero image
  expect(screen.getByRole('img', { name: /featured tattoo piece/i })).toBeTruthy();
});
