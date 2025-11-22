import { useState, useEffect } from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useReducedMotion } from './useReducedMotion';
import { onNextFrame, cancelFrame } from './parallax';

/**
 * Animation duration constants for count-up
 */
export const COUNT_DURATIONS = {
  FAST: 1000,
  NORMAL: 1500,
  SLOW: 2000,
} as const;

export type CountDuration = typeof COUNT_DURATIONS[keyof typeof COUNT_DURATIONS];

/**
 * Easing function type for count animation
 */
export type EasingFunction = (progress: number) => number;

/**
 * Built-in easing functions
 */
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
} as const;

export interface UseCountUpOptions {
  /**
   * The target number to count up to
   */
  end: number;
  
  /**
   * The number to start counting from (default: 0)
   */
  start?: number;
  
  /**
   * Animation duration in milliseconds (default: 1500)
   */
  duration?: CountDuration | number;
  
  /**
   * Easing function for animation curve (default: easeOutQuad)
   */
  easing?: EasingFunction;
  
  /**
   * Number of decimal places to display (default: 0)
   */
  decimals?: number;
  
  /**
   * Prefix to add before number (e.g., "$")
   */
  prefix?: string;
  
  /**
   * Suffix to add after number (e.g., "%", "K", "M")
   */
  suffix?: string;
  
  /**
   * Whether to start animation immediately or wait for scroll reveal (default: false)
   */
  startImmediately?: boolean;
  
  /**
   * Scroll reveal threshold (default: 0.25)
   */
  threshold?: number;
}

export interface UseCountUpReturn {
  /**
   * The current animated value as a formatted string
   */
  displayValue: string;
  
  /**
   * The current animated value as a number
   */
  currentValue: number;
  
  /**
   * Whether the animation is currently running
   */
  isAnimating: boolean;
  
  /**
   * Ref to attach to the element for scroll reveal
   */
  ref: React.RefObject<Element | null>;
}

/**
 * Hook for animated number counting with scroll reveal
 * Counts from start to end number with smooth easing
 * 
 * @param options - Configuration options for the count-up animation
 * @returns Object with display value, current value, animation state, and ref
 * 
 * @example
 * ```tsx
 * const { displayValue, ref } = useCountUp({ 
 *   end: 1234, 
 *   suffix: ' views',
 *   duration: COUNT_DURATIONS.NORMAL 
 * });
 * 
 * return <span ref={ref}>{displayValue}</span>;
 * ```
 */
export function useCountUp(options: UseCountUpOptions): UseCountUpReturn {
  const {
    end,
    start = 0,
    duration = COUNT_DURATIONS.NORMAL,
    easing = EASING_FUNCTIONS.easeOutQuad,
    decimals = 0,
    prefix = '',
    suffix = '',
    startImmediately = false,
    threshold = 0.25,
  } = options;

  const [currentValue, setCurrentValue] = useState<number>(start);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  const { isVisible, ref } = useScrollReveal({ threshold, triggerOnce: true });
  const prefersReducedMotion = useReducedMotion();
  
  // Trigger animation on scroll reveal or immediately
  const shouldAnimate = startImmediately || isVisible;
  
  useEffect(() => {
    if (!shouldAnimate || currentValue === end) return;
    
    // If reduced motion is preferred, jump to end immediately
    if (prefersReducedMotion) {
      setCurrentValue(end);
      return;
    }
    
    setIsAnimating(true);
    const startTime = Date.now();
    const range = end - start;
    
    let frameId: number;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const newValue = start + (range * easedProgress);
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        frameId = onNextFrame(animate);
      } else {
        setCurrentValue(end);
        setIsAnimating(false);
      }
    };
    
    frameId = onNextFrame(animate);
    
    return () => {
      if (frameId) cancelFrame(frameId);
      setIsAnimating(false);
    };
  }, [shouldAnimate, start, end, duration, easing, currentValue, prefersReducedMotion]);
  
  // Format the display value
  const displayValue = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;
  
  return {
    displayValue,
    currentValue,
    isAnimating,
    ref,
  };
}

/**
 * Format large numbers with K/M/B suffixes
 * 
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with suffix
 * 
 * @example
 * formatLargeNumber(1234) // "1.2K"
 * formatLargeNumber(1500000) // "1.5M"
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(decimals) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  return num.toString();
}
