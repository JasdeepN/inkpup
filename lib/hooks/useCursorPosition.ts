"use client";

import { useEffect, useState, type RefObject } from 'react';

/**
 * Track cursor position relative to a container element.
 * Returns percentages for use as CSS custom properties.
 * 
 * Respects reduced motion preference by returning static center position.
 */
export function useCursorPosition(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean = true
) {
  const [position, setPosition] = useState({ x: '50%', y: '50%' });

  useEffect(() => {
    // Skip in test environment
    if (process.env.NODE_ENV === 'test') return;
    
    if (!enabled) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = 
      typeof window !== 'undefined' && 
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` });
    };

    const handleMouseLeave = () => {
      // Reset to center when mouse leaves
      setPosition({ x: '50%', y: '50%' });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, enabled]);

  return position;
}

export default useCursorPosition;
