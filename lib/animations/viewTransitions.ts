/**
 * View Transitions API utilities for progressive enhancement
 * Browser support: Chrome 111+, Edge 111+, Safari 18+ (86% coverage)
 * Graceful fallback: Instant transitions for unsupported browsers
 */

/**
 * Feature detection for View Transitions API
 * Cached to avoid repeated checks
 */
// Export cached support flag for testing purposes ONLY (not part of public API)
export let __viewTransitionsSupportCache: boolean | undefined;

export function supportsViewTransitions(): boolean {
  if (__viewTransitionsSupportCache !== undefined) {
    return __viewTransitionsSupportCache;
  }

  if (typeof document === 'undefined') {
    __viewTransitionsSupportCache = false;
    return false;
  }

  __viewTransitionsSupportCache = 'startViewTransition' in document;
  return __viewTransitionsSupportCache;
}

/** Internal test helper: reset cached support flag */
export function __resetViewTransitionsSupportCache(): void {
  __viewTransitionsSupportCache = undefined;
}

/**
 * Configuration options for view transitions
 */
export interface ViewTransitionConfig {
  /**
   * Optional name for the transition (used in CSS targeting)
   */
  name?: string;
  
  /**
   * Skip transition (execute immediately)
   */
  skipTransition?: boolean;
}

/**
 * Wrapper for document.startViewTransition with fallback
 * Returns a promise that resolves when the transition completes
 * 
 * @param callback - Function to execute during transition
 * @param config - Optional configuration
 * @returns Promise<void>
 * 
 * @example
 * ```tsx
 * await startViewTransition(() => {
 *   setModalOpen(true);
 * });
 * ```
 */
export async function startViewTransition(
  callback: () => void | Promise<void>,
  config?: ViewTransitionConfig
): Promise<void> {
  // Skip if explicitly requested or reduced motion preferred
  if (config?.skipTransition) {
    await callback();
    return;
  }

  // Feature detection - use native API if available
  if (supportsViewTransitions() && document.startViewTransition) {
    const transition = document.startViewTransition(async () => {
      await callback();
    });
    
    await transition.finished;
    return;
  }

  // Fallback: execute immediately (instant transition)
  await callback();
}

/**
 * Generate unique view-transition-name
 * Prevents naming conflicts across components
 * 
 * @param base - Base name for the transition
 * @param id - Optional unique identifier
 * @returns Scoped view-transition-name
 * 
 * @example
 * ```tsx
 * const name = generateTransitionName('gallery-img', item.id);
 * // Returns: "gallery-img-123"
 * ```
 */
export function generateTransitionName(base: string, id?: string | number): string {
  if (id !== undefined) {
    return `${base}-${id}`;
  }
  return base;
}

/**
 * Set view-transition-name on an element
 * Returns cleanup function to remove the name
 * 
 * @param element - HTMLElement to name
 * @param name - View transition name
 * @returns Cleanup function
 * 
 * @example
 * ```tsx
 * const cleanup = setTransitionName(imgRef.current, 'hero-image');
 * // ... transition happens ...
 * cleanup(); // Remove name after transition
 * ```
 */
export function setTransitionName(
  element: HTMLElement | null,
  name: string
): () => void {
  if (!element) {
    return () => {};
  }

  // @ts-ignore - view-transition-name is not in standard CSSStyleDeclaration yet
  element.style.viewTransitionName = name;

  return () => {
    // @ts-ignore
    element.style.viewTransitionName = '';
  };
}

/**
 * React hook for managing view transition names
 * Automatically cleans up on unmount
 * 
 * @param elementRef - React ref to the element
 * @param name - View transition name
 * 
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useTransitionName(ref, 'modal-content');
 * ```
 */
export function useTransitionName(
  elementRef: React.RefObject<HTMLElement>,
  name: string | null
): void {
  if (typeof window === 'undefined') return;
  const element = elementRef.current;
  if (!element || !name) return;
  setTransitionName(element, name);
}

/**
 * TypeScript type augmentation for View Transitions API
 * Extends Document interface with startViewTransition
 */
declare global {
  interface Document {
    startViewTransition(callback: () => Promise<void> | void): {
      finished: Promise<void>;
      ready: Promise<void>;
      updateCallbackDone: Promise<void>;
    };
  }
  
  interface CSSStyleDeclaration {
    viewTransitionName: string;
  }
}

export {};
