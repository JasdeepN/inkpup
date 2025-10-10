import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PortfolioPage from './page';

jest.mock('../../lib/r2-server', () => ({
  listGalleryImages: jest.fn().mockResolvedValue({
    items: [
      {
        id: 'mock-item',
        src: '/tattoo/mock-item.webp',
        alt: 'Mock artwork',
        caption: 'Mock caption',
        category: 'healed',
      },
    ],
    isFallback: false,
  }),
}));

test('Portfolio listing renders heading', async () => {
  const ui = await PortfolioPage();
  render(ui);
  expect(await screen.findByRole('heading', { name: /Portfolio/i })).toBeInTheDocument();
});
