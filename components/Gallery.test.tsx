import React from 'react';
import { render, screen } from '@testing-library/react';
import Gallery from './Gallery';
import gallery from '../data/gallery.json';

test('Gallery renders items from data', () => {
  render(<Gallery items={gallery.slice(0,3)} />);
  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
});
