'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { startViewTransition } from '../lib/animations/viewTransitions';
import { waitForNavigation } from '../lib/animations/navigationSignal';
import React from 'react';

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  href: string;
  ['aria-label']?: string;
}

/**
 * Link component that triggers a View Transition on navigation.
 * Use this for links that should animate between pages.
 */
export default function TransitionLink({ children, href, onClick, ...props }: TransitionLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    // Only handle left clicks and no modifier keys
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();
    
    const targetUrl = href.toString();
    // If navigating to the same page, just push (Next.js handles scroll) and don't wait
    if (targetUrl === pathname || targetUrl === pathname + '/') {
      router.push(targetUrl);
      return;
    }

    void startViewTransition(async () => {
      router.push(targetUrl);
      // Wait for the new page to mount (signaled by PageTransitionWrapper)
      const timeout = new Promise(resolve => setTimeout(resolve, 2000));
      await Promise.race([waitForNavigation(), timeout]);
    }, { name: 'page-nav' });
  };

  return (
    <Link href={href} {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}
