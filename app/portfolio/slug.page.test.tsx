import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioItem from './[slug]/page';

const createParams = (slug: string) => Promise.resolve({ slug });

test('Portfolio item renders slug and gallery', async () => {
  const ui = await PortfolioItem({ params: createParams('test-slug') });
  render(ui);

  expect(await screen.findByText(/Portfolio item: test-slug/i)).toBeInTheDocument();

  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
});
