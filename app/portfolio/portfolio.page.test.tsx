import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioPage from './page';

test('Portfolio listing renders heading', () => {
  render(<PortfolioPage />);
  expect(screen.getByRole('heading', { name: /Portfolio/i })).toBeInTheDocument();
});
