import React from 'react';
import { render, screen } from '@testing-library/react';
import PortfolioItem from './[slug]/page';

// Mock window.matchMedia for useReducedMotion hook
const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '(prefers-reduced-motion: reduce)',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => mockMatchMedia(false)),
  });
  
  // Mock IntersectionObserver for useScrollReveal hook
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
});

const createParams = (slug: string) => Promise.resolve({ slug });

test('Portfolio item renders slug and gallery', async () => {
  const ui = await PortfolioItem({ params: createParams('test-slug') });
  render(ui);

  expect(await screen.findByText(/Portfolio item: test-slug/i)).toBeInTheDocument();

  const imgs = screen.getAllByRole('img');
  expect(imgs.length).toBeGreaterThan(0);
});
