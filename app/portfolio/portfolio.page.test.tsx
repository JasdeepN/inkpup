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
    usedBundledFallback: false,
    credentialStatus: {
      accountId: true,
      bucket: true,
      accessKey: true,
      secretAccessKey: true,
    },
  }),
}));

test('Portfolio listing renders heading', async () => {
  const ui = await PortfolioPage();
  render(ui);
  expect(await screen.findByRole('heading', { name: /Portfolio/i })).toBeInTheDocument();
});

test('Portfolio listing handles legacy asPromise result shape', async () => {
  const { listGalleryImages } = await import('../../lib/r2-server');
  const legacyResult = {
    items: [
      {
        id: 'legacy-item',
        src: '/tattoo/legacy.webp',
        alt: 'Legacy artwork',
        caption: 'Legacy caption',
        category: 'healed',
        usedBundledFallback: false,
      },
    ],
    isFallback: true,
    fallbackReason: 'missing_credentials',
    usedBundledFallback: true,
    credentialStatus: {
      accountId: false,
      bucket: false,
      accessKey: false,
      secretAccessKey: false,
    },
  };
  const asPromise = jest.fn().mockResolvedValue(legacyResult);
  (listGalleryImages as jest.Mock).mockReturnValueOnce({ asPromise });

  const ui = await PortfolioPage();
  render(ui);

  expect(asPromise).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole('heading', { name: /Portfolio/i })).toBeInTheDocument();
});
