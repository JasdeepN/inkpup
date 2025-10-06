import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

// Mock tsparticles components to avoid loading the real engine in tests
jest.mock('@tsparticles/react', () => ({
  __esModule: true,
  // default Particles component
  default: ({ className }: { className?: string }) => (
    <div data-testid="mock-particles" className={className} />
  ),
  // initParticlesEngine should call the callback and resolve
  initParticlesEngine: jest.fn((cb: (engine: unknown) => Promise<void>) => Promise.resolve(cb({}))),
}));

jest.mock('tsparticles', () => ({ loadFull: jest.fn(() => Promise.resolve()) }));

import ParticlesBackground from './ParticlesBackground';
import { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';

describe('ParticlesBackground', () => {
  const originalMatchMedia = window.matchMedia;
  const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  const mockedInit = initParticlesEngine as jest.Mock;
  const mockedLoadFull = loadFull as unknown as jest.Mock;

  const createMatchMedia = (shouldReduceMotion = false) =>
    (query: string): MediaQueryList => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? shouldReduceMotion : false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

  beforeEach(() => {
    mockedInit.mockClear();
    mockedLoadFull.mockClear();
    window.matchMedia = createMatchMedia();
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: undefined,
    });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
    if (originalConnection) {
      Object.defineProperty(navigator, 'connection', originalConnection);
    } else {
      delete (navigator as any).connection;
    }
  });

  test('renders fallback when reduced motion is preferred', async () => {
    window.matchMedia = createMatchMedia(true);

    await act(async () => {
      render(<ParticlesBackground />);
    });

    expect(screen.getByTestId('particles-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-particles')).not.toBeInTheDocument();
  });

  test('renders interactive particles when engine is ready', async () => {
    await act(async () => {
      render(<ParticlesBackground />);
    });

    await waitFor(() => expect(screen.getByTestId('mock-particles')).toBeInTheDocument());
    expect(screen.queryByTestId('particles-fallback')).not.toBeInTheDocument();
    expect(mockedInit).toHaveBeenCalledTimes(1);
    expect(mockedLoadFull).toHaveBeenCalledTimes(1);
  });

  test('disables particles when navigator.connection indicates saveData or slow network', async () => {
    // simulate connection with saveData true
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '4g', addEventListener: jest.fn(), removeEventListener: jest.fn() },
    });

    const { unmount } = render(<ParticlesBackground />);
    await act(async () => {
      // initial render
    });

    // fallback should render when saveData is true
    expect(screen.getByTestId('particles-fallback')).toBeInTheDocument();

    // unmount before next render to avoid duplicates in DOM
    unmount();

    // simulate slow-2g
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: false, effectiveType: 'slow-2g', addEventListener: jest.fn(), removeEventListener: jest.fn() },
    });

    const { getByTestId } = render(<ParticlesBackground />);
    expect(getByTestId('particles-fallback')).toBeInTheDocument();
  });
});
