import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioItem from './[slug]/page';

test('Portfolio item renders slug and gallery', () => {
  render(<PortfolioItem params={{ slug: 'test-slug' }} />);
  expect(screen.getByText(/Portfolio item: test-slug/i)).toBeInTheDocument();
  // gallery should render images
  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
});
