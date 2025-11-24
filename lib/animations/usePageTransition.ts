import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { startViewTransition } from './viewTransitions';

/**
 * Hook to trigger page transitions using the View Transitions API
 * Wraps Next.js router methods with startViewTransition
 * 
 * @example
 * ```tsx
 * const { navigate } = usePageTransition();
 * <button onClick={() => navigate('/about')}>About</button>
 * ```
 */
export function usePageTransition() {
  const router = useRouter();

  const navigate = useCallback((href: string) => {
    void startViewTransition(() => {
      router.push(href);
    });
  }, [router]);

  const replace = useCallback((href: string) => {
    void startViewTransition(() => {
      router.replace(href);
    });
  }, [router]);

  const back = useCallback(() => {
    void startViewTransition(() => {
      router.back();
    });
  }, [router]);

  return { navigate, replace, back };
}
