'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScrollRevealOptions } from './types';
import { THRESHOLD, ROOT_MARGIN } from './constants';

/**
 * Hook to detect when an element enters the viewport
 * Uses Intersection Observer API for performance
 * 
 * @param options - Configuration for intersection behavior
 * @returns Object with isVisible state and ref callback
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = THRESHOLD.EARLY,
    rootMargin = ROOT_MARGIN.DEFAULT,
    triggerOnce = true,
    root = null,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    
    // Early return if no element or already visible and triggerOnce
    if (!element || (isVisible && triggerOnce)) {
      return;
    }

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Graceful degradation: show immediately if no support
      setIsVisible(true);
      return;
    }

    // Create observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Disconnect if triggerOnce
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          } else if (!triggerOnce) {
            // Allow re-hiding if not triggerOnce
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, root, triggerOnce, isVisible]);

  return { isVisible, ref };
}
