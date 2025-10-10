import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Gallery from './Gallery';
import type { GalleryItem } from '../lib/gallery-types';

const originalCaptionFlag = process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS;

afterEach(() => {
  if (typeof originalCaptionFlag === 'undefined') {
    delete process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS;
  } else {
    process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS = originalCaptionFlag;
  }
});

test('Gallery renders provided gallery items', () => {
  const sampleItems: GalleryItem[] = [
    {
      id: 'flash-1',
      category: 'flash',
      src: '/flash/flash-1.webp',
      alt: 'Flash Item',
      caption: 'Caption',
    },
    {
      id: 'flash-2',
      category: 'flash',
      src: '/flash/flash-2.webp',
      alt: 'Second Item',
    },
    {
      id: 'healed-1',
      category: 'healed',
      src: '/healed/healed-1.webp',
      alt: 'Healed Item',
    },
  ];

  render(<Gallery items={sampleItems} />);
  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
});

test('Gallery shows skeletons while loading without items', () => {
  const { container } = render(<Gallery items={[]} loading />);
  expect(container.querySelectorAll('.gallery-card--skeleton').length).toBeGreaterThan(0);
});

test('Gallery shows empty message when no items and not loading', () => {
  render(<Gallery items={[]} loading={false} />);
  expect(screen.getByText(/No artwork in this category/i)).toBeInTheDocument();
});

test('Gallery invokes onSelect and renders captions for items', async () => {
  process.env.NEXT_PUBLIC_SHOW_GALLERY_CAPTIONS = 'true';
  const user = userEvent.setup();
  const handleSelect = jest.fn();
  const items: GalleryItem[] = [
    {
      id: 'item-1',
      src: '/flash/example.webp',
      category: 'flash',
      caption: 'Featured piece',
      alt: '',
    },
  ];

  render(<Gallery items={items} onSelect={handleSelect} />);

  const button = screen.getByRole('button', { name: /View tattoo artwork in full size/i });
  await user.click(button);

  expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }));
  expect(screen.getByText('Featured piece')).toBeInTheDocument();
});

test('Gallery shows backup badge when fallbackActive', () => {
  const items: GalleryItem[] = [
    {
      id: 'backup-1',
      category: 'flash',
      src: '/flash/backup-1.webp',
      alt: 'Backup Item',
    },
  ];

  render(<Gallery items={items} fallbackActive />);

  expect(screen.getByText(/^Backup$/i)).toBeInTheDocument();
});
