import type { Meta, StoryObj } from '@storybook/react';
import GalleryView from './GalleryView';
import type { GalleryItem } from '../lib/gallery-types';
import galleryData from '../data/gallery.json';

const healedItems = (galleryData as GalleryItem[]).filter((item) => item.category === 'healed');

const meta: Meta<typeof GalleryView> = {
  title: 'Gallery/GalleryView',
  component: GalleryView,
  tags: ['test-only'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof GalleryView>;

export const Default: Story = {
  args: {
    initialCategory: 'healed',
    initialData: {
      items: healedItems,
      fallback: false,
    },
  },
};