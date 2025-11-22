import { renderHook } from '@testing-library/react';
import { useScrollReveal } from './useScrollReveal';

describe('useScrollReveal', () => {
  const mockObserve = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: mockObserve,
      unobserve: jest.fn(),
      disconnect: mockDisconnect,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return ref and isVisible false initially', () => {
    const { result } = renderHook(() => useScrollReveal());
    
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('should accept custom options without errors', () => {
    const options = {
      threshold: 0.5,
      rootMargin: '0px 0px -100px 0px',
      triggerOnce: false,
    };

    const { result } = renderHook(() => useScrollReveal(options));
    
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
  });

  it('should gracefully degrade when IntersectionObserver is not supported', () => {
    const originalIO = global.IntersectionObserver;
    (global as {IntersectionObserver?: unknown}).IntersectionObserver = undefined;

    const { result } = renderHook(() => useScrollReveal());

    // Should still provide ref and initial state
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
    
    global.IntersectionObserver = originalIO;
  });

  it('should provide a mutable ref object', () => {
    const { result } = renderHook(() => useScrollReveal());
    
    // Verify ref is a proper React ref
    expect(result.current.ref).toHaveProperty('current');
    expect(result.current.ref.current).toBeNull();
  });
});
