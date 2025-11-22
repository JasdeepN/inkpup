/**
 * Animation Constants
 * Shared threshold values, timing constants, and configuration defaults
 */

// Intersection Observer threshold presets
export const THRESHOLD = {
  /** Trigger when 10% visible */
  EARLY: 0.1,
  /** Trigger when 25% visible */
  QUARTER: 0.25,
  /** Trigger when 50% visible */
  HALF: 0.5,
  /** Trigger when 75% visible */
  MOST: 0.75,
  /** Trigger when fully visible */
  FULL: 1.0,
} as const;

// Root margin presets for early/late triggering
export const ROOT_MARGIN = {
  /** Trigger 100px before element enters viewport */
  EARLY: '0px 0px -100px 0px',
  /** Trigger when element enters viewport */
  DEFAULT: '0px',
  /** Trigger 200px after element enters viewport */
  LATE: '0px 0px 200px 0px',
} as const;

// Stagger timing constants (milliseconds)
export const STAGGER = {
  /** Very fast stagger between elements */
  FAST: 50,
  /** Normal stagger between elements */
  NORMAL: 100,
  /** Slow stagger between elements */
  SLOW: 150,
  /** Maximum stagger delay to prevent long waits */
  MAX_DELAY: 1000,
} as const;

// Count-up animation durations (milliseconds)
export const COUNT_DURATION = {
  FAST: 1000,
  NORMAL: 1500,
  SLOW: 2000,
} as const;

// Parallax speed presets
export const PARALLAX_SPEED = {
  SLOW: 0.5,
  MEDIUM: 0.3,
  FAST: 0.15,
} as const;
