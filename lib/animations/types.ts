/**
 * Animation Types and Interfaces
 * Defines TypeScript types for scroll-based animation utilities
 */

export interface ScrollRevealOptions {
  /** Percentage of element visibility required to trigger (0-1) */
  threshold?: number | number[];
  /** Margin around the root element (e.g., "0px 0px -100px 0px") */
  rootMargin?: string;
  /** If true, animation triggers only once */
  triggerOnce?: boolean;
  /** Root element for intersection (null = viewport) */
  root?: Element | null;
}

export interface IntersectionObserverConfig {
  threshold: number | number[];
  rootMargin: string;
  root: Element | null;
}

export enum AnimationState {
  IDLE = 'idle',
  ANIMATING = 'animating',
  COMPLETE = 'complete',
}

export interface CountUpOptions {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function name */
  easing?: 'linear' | 'easeOut' | 'easeInOut';
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Suffix string (e.g., "K", "%") */
  suffix?: string;
}

export interface ParallaxOptions {
  /** Speed multiplier (0-1, lower is slower) */
  speed?: number;
  /** Direction of parallax movement */
  direction?: 'up' | 'down';
}
