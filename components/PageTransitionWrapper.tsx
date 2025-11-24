'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { supportsViewTransitions } from '../lib/animations/viewTransitions';
import { signalNavigationComplete } from '../lib/animations/navigationSignal';

/**
 * Wrapper component to apply unique view-transition-name based on the current route.
 * Enables distinct page transition animations per route.
 */
export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Signal that navigation is complete whenever the pathname changes
  useEffect(() => {
    signalNavigationComplete();
  }, [pathname]);

  // Generate a safe name from pathname
  // / -> page-home
  // /about -> page-about
  // /portfolio -> page-portfolio
  const safePathname = pathname || '/';
  const segment = safePathname === '/' ? 'home' : safePathname.split('/')[1] || 'unknown';
  const transitionName = `page-${segment}`;

  // view-transition-name removed to use default 'root' transition (viewport-based)
  // This prevents "tiny page" artifacts caused by element-based transitions on dynamic height containers.
  // const style = { viewTransitionName: transitionName };

  return (
    <div className="page-transition-wrapper" suppressHydrationWarning>
      {children}
    </div>
  );
}
