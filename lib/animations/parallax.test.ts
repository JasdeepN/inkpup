/**
 * @jest-environment jsdom
 */
import {
  PARALLAX_SPEEDS,
  calculateParallaxTransform,
  throttle,
  onNextFrame,
  cancelFrame,
} from './parallax';

describe('parallax utilities', () => {
  describe('PARALLAX_SPEEDS constants', () => {
    test('defines expected speed values', () => {
      expect(PARALLAX_SPEEDS.SLOW).toBe(0.5);
      expect(PARALLAX_SPEEDS.MEDIUM).toBe(0.3);
      expect(PARALLAX_SPEEDS.FAST).toBe(0.15);
    });
  });

  describe('calculateParallaxTransform', () => {
    test('calculates transform with default MEDIUM speed', () => {
      const result = calculateParallaxTransform(100);
      expect(result).toBe('translateY(30px)'); // 100 * 0.3
    });

    test('calculates transform with SLOW speed', () => {
      const result = calculateParallaxTransform(200, PARALLAX_SPEEDS.SLOW);
      expect(result).toBe('translateY(100px)'); // 200 * 0.5
    });

    test('calculates transform with FAST speed', () => {
      const result = calculateParallaxTransform(300, PARALLAX_SPEEDS.FAST);
      expect(result).toBe('translateY(45px)'); // 300 * 0.15
    });

    test('handles zero scroll position', () => {
      const result = calculateParallaxTransform(0);
      expect(result).toBe('translateY(0px)');
    });

    test('handles negative scroll position', () => {
      const result = calculateParallaxTransform(-50, PARALLAX_SPEEDS.MEDIUM);
      expect(result).toBe('translateY(-15px)'); // -50 * 0.3
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('executes function immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('arg1');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    test('throttles subsequent calls within limit', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('call1');
      throttled('call2');
      throttled('call3');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call1');
    });

    test('allows execution after throttle limit expires', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('call1');
      expect(fn).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(101); // Advance past the limit
      
      throttled('call2');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('call1');
      expect(fn).toHaveBeenCalledWith('call2');
    });
  });

  describe('onNextFrame', () => {
    test('uses requestAnimationFrame when available', () => {
      const spy = jest.spyOn(window, 'requestAnimationFrame');
      const callback = jest.fn();

      onNextFrame(callback);

      expect(spy).toHaveBeenCalledWith(callback);
      spy.mockRestore();
    });

    test('falls back to setTimeout in environments without requestAnimationFrame', () => {
      const originalRAF = window.requestAnimationFrame;
      // @ts-expect-error - temporarily removing requestAnimationFrame
      delete window.requestAnimationFrame;

      const spy = jest.spyOn(global, 'setTimeout');
      const callback = jest.fn();

      onNextFrame(callback);

      expect(spy).toHaveBeenCalledWith(callback, 16);
      
      spy.mockRestore();
      window.requestAnimationFrame = originalRAF;
    });
  });

  describe('cancelFrame', () => {
    test('uses cancelAnimationFrame when available', () => {
      const spy = jest.spyOn(window, 'cancelAnimationFrame');
      const frameId = 12345;

      cancelFrame(frameId);

      expect(spy).toHaveBeenCalledWith(frameId);
      spy.mockRestore();
    });

    test('falls back to clearTimeout in environments without cancelAnimationFrame', () => {
      const originalCAF = window.cancelAnimationFrame;
      // @ts-expect-error - temporarily removing cancelAnimationFrame
      delete window.cancelAnimationFrame;

      const spy = jest.spyOn(global, 'clearTimeout');
      const frameId = 12345;

      cancelFrame(frameId);

      expect(spy).toHaveBeenCalledWith(frameId);
      
      spy.mockRestore();
      window.cancelAnimationFrame = originalCAF;
    });
  });
});
