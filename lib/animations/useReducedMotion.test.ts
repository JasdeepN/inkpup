import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let matchMediaMock: jest.Mock;

  beforeEach(() => {
    matchMediaMock = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return false when prefers-reduced-motion is not set', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when prefers-reduced-motion: reduce', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', async () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate media query change - wrapped in act
    if (changeHandler) {
      await import('@testing-library/react').then(({ act }) => {
        act(() => {
          changeHandler!({ matches: true } as MediaQueryListEvent);
        });
      });
    }
  });

  it('should cleanup listener on unmount', () => {
    const removeEventListenerMock = jest.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: removeEventListenerMock,
    });

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeEventListenerMock).toHaveBeenCalled();
  });

  it('should handle browsers without addEventListener (fallback)', () => {
    const addListenerMock = jest.fn();
    const removeListenerMock = jest.fn();

    matchMediaMock.mockReturnValue({
      matches: false,
      addListener: addListenerMock,
      removeListener: removeListenerMock,
    });

    const { unmount } = renderHook(() => useReducedMotion());
    expect(addListenerMock).toHaveBeenCalled();

    unmount();
    expect(removeListenerMock).toHaveBeenCalled();
  });
});
