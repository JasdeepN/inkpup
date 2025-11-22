/**
 * Stagger Animation Utilities
 * Calculate delays for staggered animations
 */

import { STAGGER } from './constants';

/**
 * Calculate stagger delay for an element at a given index
 * @param index - Zero-based index of the element
 * @param baseDelay - Base delay in milliseconds (default: 0)
 * @param increment - Delay increment between elements (default: 100ms)
 * @returns Delay in milliseconds
 */
export function calculateStaggerDelay(
  index: number,
  baseDelay: number = 0,
  increment: number = STAGGER.NORMAL
): number {
  const delay = baseDelay + (index * increment);
  return Math.min(delay, STAGGER.MAX_DELAY);
}

/**
 * Generate stagger delays for multiple elements
 * @param count - Number of elements
 * @param baseDelay - Base delay in milliseconds (default: 0)
 * @param increment - Delay increment between elements (default: 100ms)
 * @returns Array of delays in milliseconds
 */
export function generateStaggerDelays(
  count: number,
  baseDelay: number = 0,
  increment: number = STAGGER.NORMAL
): number[] {
  return Array.from({ length: count }, (_, i) => 
    calculateStaggerDelay(i, baseDelay, increment)
  );
}

/**
 * Create CSS transition-delay string
 * @param delay - Delay in milliseconds
 * @returns CSS transition-delay value (e.g., "200ms")
 */
export function formatDelayCSS(delay: number): string {
  return `${delay}ms`;
}
