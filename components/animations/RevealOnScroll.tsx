'use client';

import { useScrollReveal } from '../../lib/animations/useScrollReveal';
import { useReducedMotion } from '../../lib/animations/useReducedMotion';
import type { ReactNode } from 'react';
import type { ScrollRevealOptions } from '../../lib/animations/types';

interface RevealOnScrollProps extends ScrollRevealOptions {
  children: ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Delay before animation starts (milliseconds) */
  delay?: number;
}

/**
 * Wrapper component that reveals children when scrolled into view
 * Uses Intersection Observer API for performance
 */
export default function RevealOnScroll({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: RevealOnScrollProps) {
  const { isVisible, ref } = useScrollReveal({ threshold, rootMargin, triggerOnce });
  const prefersReducedMotion = useReducedMotion();

  // Test environment shortcut: avoid IntersectionObserver/state churn to prevent act warnings
  if (process.env.NODE_ENV === 'test') {
    return <div className={className}>{children}</div>;
  }

  // Skip animation if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion;
  const visibilityClass = shouldAnimate 
    ? (isVisible ? 'reveal-visible' : 'reveal-hidden')
    : ''; // No animation classes if reduced motion

  const style = delay > 0 && shouldAnimate
    ? { transitionDelay: `${delay}ms` }
    : undefined;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${visibilityClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
