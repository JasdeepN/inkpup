import React from 'react';
import { render, screen } from '@testing-library/react';

describe('SmartImage', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('renders standard image with width and height', async () => {
    const { default: SmartImage } = await import('./SmartImage');

    render(<SmartImage src='/images/base.png' alt='Standard' width={320} height={200} className='basic' />);

    const img = screen.getByRole('img', { name: 'Standard' });
    expect(img).toHaveAttribute('src', '/images/base.png');
    expect(img).toHaveAttribute('width', '320');
    expect(img).toHaveAttribute('height', '200');
    expect(img).toHaveClass('basic');
  });

  test('renders fill variant without explicit dimensions', async () => {
    const { default: SmartImage } = await import('./SmartImage');

    render(
      <SmartImage src='art.webp' alt='Fill artwork' fill priority className='cover' sizes='100vw' />
    );

    const img = screen.getByRole('img', { name: 'Fill artwork' });
    expect(img).toHaveAttribute('src', 'art.webp');
    expect(img).not.toHaveAttribute('width');
    expect(img).not.toHaveAttribute('height');
    expect(img).toHaveClass('cover');
  });
});
