import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioPage from './page';

test('Portfolio listing renders heading', async () => {
  const ui = await PortfolioPage();
  render(ui);
  expect(await screen.findByRole('heading', { name: /Portfolio/i })).toBeInTheDocument();
});
