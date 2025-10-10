import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

test('Hero renders heading, CTA, and hero image when provided', () => {
  const heroImage = {
    src: 'https://example.com/hero.webp',
    alt: 'Featured tattoo piece',
  };

  render(<Hero heroImage={heroImage} />);
  expect(screen.getByRole('heading')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /book/i })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /featured tattoo piece/i })).toBeInTheDocument();
});
