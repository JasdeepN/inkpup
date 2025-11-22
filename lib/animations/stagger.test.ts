import { calculateStaggerDelay, generateStaggerDelays, formatDelayCSS } from './stagger';
import { STAGGER } from './constants';

describe('Stagger Utilities', () => {
  describe('calculateStaggerDelay', () => {
    it('should calculate delay with default increment', () => {
      expect(calculateStaggerDelay(0)).toBe(0);
      expect(calculateStaggerDelay(1)).toBe(100);
      expect(calculateStaggerDelay(2)).toBe(200);
      expect(calculateStaggerDelay(5)).toBe(500);
    });

    it('should use custom base delay', () => {
      expect(calculateStaggerDelay(0, 100)).toBe(100);
      expect(calculateStaggerDelay(1, 100)).toBe(200);
      expect(calculateStaggerDelay(2, 100)).toBe(300);
    });

    it('should use custom increment', () => {
      expect(calculateStaggerDelay(0, 0, 50)).toBe(0);
      expect(calculateStaggerDelay(1, 0, 50)).toBe(50);
      expect(calculateStaggerDelay(2, 0, 50)).toBe(100);
    });

    it('should cap delay at MAX_DELAY', () => {
      const result = calculateStaggerDelay(100, 0, 100);
      expect(result).toBe(STAGGER.MAX_DELAY);
      expect(result).toBeLessThanOrEqual(STAGGER.MAX_DELAY);
    });
  });

  describe('generateStaggerDelays', () => {
    it('should generate array of delays', () => {
      const delays = generateStaggerDelays(3);
      expect(delays).toEqual([0, 100, 200]);
    });

    it('should generate with custom base delay', () => {
      const delays = generateStaggerDelays(3, 100);
      expect(delays).toEqual([100, 200, 300]);
    });

    it('should generate with custom increment', () => {
      const delays = generateStaggerDelays(4, 0, 50);
      expect(delays).toEqual([0, 50, 100, 150]);
    });

    it('should generate empty array for zero count', () => {
      const delays = generateStaggerDelays(0);
      expect(delays).toEqual([]);
    });
  });

  describe('formatDelayCSS', () => {
    it('should format delay as CSS value', () => {
      expect(formatDelayCSS(0)).toBe('0ms');
      expect(formatDelayCSS(100)).toBe('100ms');
      expect(formatDelayCSS(250)).toBe('250ms');
      expect(formatDelayCSS(1000)).toBe('1000ms');
    });
  });
});
