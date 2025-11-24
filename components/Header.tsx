"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TransitionLink from './TransitionLink';
import { startViewTransition } from '../lib/animations/viewTransitions';

export default function Header() {
  // Dark mode toggle
  const [dark, setDark] = useState(true);
  // Mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const pathname = usePathname() || '';

  return (
    <header className="sticky-header">
      <div className="nav-shell">
        <div className="sticky-nav flex items-center gap-6 w-full">
          <TransitionLink href="/" className="nav-brand font-semibold text-lg">
            InkPup
          </TransitionLink>
          {/* Primary navigation (desktop) */}
          <nav
            className="admin-nav hidden md:flex items-center gap-6"
            aria-label="Primary"
            aria-hidden={mobileOpen ? 'true' : 'false'}
          >
            {[
              { href: '/flash', label: 'Flash Available' },
              { href: '/custom-design', label: 'Custom Work' },
              { href: '/portfolio', label: 'Portfolio' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/contact', label: 'Contact' },
              { href: '/about', label: 'About' },
            ].map(({ href, label }) => (
              <TransitionLink
                key={href}
                href={href}
                className={`nav-link ${pathname === href || (href !== '/' && pathname.startsWith(href)) ? 'active' : ''}`}
              >
                {label}
              </TransitionLink>
            ))}
          </nav>
          <div className="flex items-center gap-4 header-actions ml-auto">
            <TransitionLink href="/contact" className="btn btn--primary hidden md:inline-flex">
              Book Now
            </TransitionLink>
            <button
              type="button"
              aria-label="Toggle dark mode"
              className="text-2xl hover:text-accent transition-colors"
              onClick={() => {
                const next = !dark;
                void startViewTransition(() => {
                  setDark(next);
                  if (next) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                });
              }}
            >
              {dark ? '🌙' : '☀️'}
            </button>
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden mobile-menu-button"
              onClick={() => setMobileOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setMobileOpen(false);
              }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {/* Mobile navigation */}
        <nav
          aria-label="Mobile"
          aria-hidden={mobileOpen ? 'false' : 'true'}
          className={`mobile-nav ${mobileOpen ? '' : 'hidden'}`}
        >
          <div className="mobile-nav__inner">
            <TransitionLink href="/flash" className="nav-link" onClick={() => setMobileOpen(false)}>Flash Available</TransitionLink>
            <TransitionLink href="/custom-design" className="nav-link" onClick={() => setMobileOpen(false)}>Custom Work</TransitionLink>
            <TransitionLink href="/portfolio" className="nav-link" onClick={() => setMobileOpen(false)}>Portfolio</TransitionLink>
            <TransitionLink href="/pricing" className="nav-link" onClick={() => setMobileOpen(false)}>Pricing</TransitionLink>
            <TransitionLink href="/contact" className="nav-link" onClick={() => setMobileOpen(false)}>Contact</TransitionLink>
            <TransitionLink href="/about" className="nav-link" onClick={() => setMobileOpen(false)}>About</TransitionLink>
            <TransitionLink href="/contact" className="btn btn--primary mt-2" onClick={() => setMobileOpen(false)}>Book Now</TransitionLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
