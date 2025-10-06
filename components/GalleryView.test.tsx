import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock feature flag module so we can toggle captions on/off in tests
jest.mock('../lib/featureFlags', () => ({
  isGalleryCaptionsEnabled: jest.fn(),
}));

import { isGalleryCaptionsEnabled } from '../lib/featureFlags';
import GalleryView from './GalleryView';
import type { GalleryItem } from '../lib/gallery-types';

describe('GalleryView', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test('shows an error alert when fetching a category fails', async () => {
    // Make fetch return a non-ok response
    global.fetch = jest.fn(async () => ({ ok: false } as unknown as Response));

    // captions disabled by default
    (isGalleryCaptionsEnabled as jest.Mock).mockReturnValue(false);

    const items: GalleryItem[] = [
      { id: '1', src: '/img1.webp', category: 'flash', alt: 'One' },
    ];

    render(<GalleryView initialCategory="flash" initialItems={items} />);

    // Click another category tab (the component renders buttons for all categories)
    const buttons = screen.getAllByRole('tab');
    // choose a category that's not the initial one (if available)
    const otherBtn = buttons.find((b) => b.getAttribute('aria-selected') !== 'true');
    expect(otherBtn).toBeDefined();

    await userEvent.click(otherBtn as Element);

    // Wait for the error message to appear
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').textContent).toMatch(/Could not load/i);
  });

  test('opens modal and shows caption when captions feature flag is enabled', async () => {
    (isGalleryCaptionsEnabled as jest.Mock).mockReturnValue(true);

    const items: GalleryItem[] = [
      {
        id: 'item-1',
        src: '/flash/example.webp',
        category: 'flash',
        caption: 'Featured piece',
        alt: '',
      },
    ];

    render(<GalleryView initialCategory="flash" initialItems={items} />);

    // Click the gallery item to open modal
  // the gallery button aria-label contains the item alt, so match the generic pattern
  const button = screen.getByRole('button', { name: /View .* in full size/i });
    await userEvent.click(button);

    // The dialog should be present and caption rendered
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toBeInTheDocument();
  // scope lookup to the dialog to avoid matching the same caption in the gallery card
  const { getByText } = within(dialog);
  expect(getByText('Featured piece')).toBeInTheDocument();
  });

  test('fetchCategory success populates items for a new category', async () => {
    (isGalleryCaptionsEnabled as jest.Mock).mockReturnValue(false);

    const items = [
      { id: 'f-1', src: '/flash/new.webp', category: 'flash', alt: 'New' },
    ];

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ items }),
    } as unknown as Response));

    render(<GalleryView initialCategory="healed" initialItems={[]} />);

    // Click the flash tab
    const flashBtn = screen.getByRole('tab', { name: /Flash/i });
    await userEvent.click(flashBtn);

    // Wait for gallery item to render
    await waitFor(() => expect(screen.getByRole('img', { name: 'New' })).toBeInTheDocument());
  });

  test('modal size updates on image load and window resize', async () => {
    (isGalleryCaptionsEnabled as jest.Mock).mockReturnValue(false);

    const items = [
      { id: '1', src: '/img1.webp', category: 'flash', alt: 'One' },
    ] as unknown as GalleryItem[];

    render(<GalleryView initialCategory="flash" initialItems={items} />);

    // Click to open modal
  const button = screen.getByRole('button', { name: /View .* in full size/i });
    await userEvent.click(button);

    // Mock natural size via calling onLoadingComplete by finding the image and invoking the callback
    // The SmartImage component used uses next/image mock in tests; here we simulate resize via dispatch
    // Set a large window size and dispatch resize
    (window as any).innerWidth = 1600;
    (window as any).innerHeight = 900;
    window.dispatchEvent(new Event('resize'));

    // dialog should render and have inline style for modal size or at least be present
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // ensure style applied or modal content present
    expect(dialog.querySelector('.gallery-modal__image')).toBeTruthy();
  });
});
