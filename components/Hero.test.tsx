import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

test('Hero renders heading and CTA', () => {
  render(<Hero />);
  expect(screen.getByRole('heading')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /book/i })).toBeInTheDocument();
});
