/**
 * Parallax scroll effect utilities
 * Calculates transform values for parallax backgrounds with performance optimization
 */

/**
 * Parallax speed presets
 * Slower values create more dramatic parallax effect
 */
export const PARALLAX_SPEEDS = {
  SLOW: 0.5,    // Dramatic parallax
  MEDIUM: 0.3,  // Balanced parallax
  FAST: 0.15,   // Subtle parallax
} as const;

export type ParallaxSpeed = typeof PARALLAX_SPEEDS[keyof typeof PARALLAX_SPEEDS];

/**
 * Calculate parallax transform based on scroll position
 * Uses throttled approach for 60fps performance
 * 
 * @param scrollY - Current scroll position (window.scrollY)
 * @param speed - Parallax speed multiplier (0.1 to 1.0, lower is more dramatic)
 * @returns CSS transform string for translateY
 */
export function calculateParallaxTransform(scrollY: number, speed: ParallaxSpeed = PARALLAX_SPEEDS.MEDIUM): string {
  const offset = scrollY * speed;
  return `translateY(${offset}px)`;
}

/**
 * Throttle function to limit execution rate
 * Used to ensure parallax calculations run at 60fps max
 * 
 * @param fn - Function to throttle
 * @param limit - Minimum time between executions (ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Request animation frame wrapper for smooth scroll updates
 * Ensures parallax updates happen on browser paint cycle
 * 
 * @param callback - Function to execute on next frame
 * @returns Animation frame ID for cancellation
 */
export function onNextFrame(callback: () => void): number {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  // Fallback for SSR or old browsers
  return setTimeout(callback, 16) as unknown as number; // ~60fps
}

/**
 * Cancel scheduled animation frame
 * 
 * @param frameId - ID from requestAnimationFrame or setTimeout
 */
export function cancelFrame(frameId: number): void {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(frameId);
  } else {
    clearTimeout(frameId);
  }
}
