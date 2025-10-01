"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (open && firstLinkRef.current) (firstLinkRef.current as any).focus();
    // prevent body scroll when menu open on small screens
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close menu on Escape key for accessibility
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Dark mode toggle
  const [dark, setDark] = useState(true);
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="site-header__brand">
          <Link href="/" className="text-2xl font-bold" data-testid="site-logo">InkPup</Link>
          <nav className="primary-nav hidden md:flex" aria-label="Primary">
            <Link href="/portfolio" data-testid="nav-portfolio">Portfolio</Link>
            <Link href="/contact" data-testid="nav-contact">Contact</Link>
            <Link href="/about" data-testid="nav-about">About</Link>
          </nav>
        </div>

        <div className="header-actions">
          <Link href="/contact" className="btn btn--primary" data-testid="nav-book">Book</Link>
          <button
            className="mobile-menu-button md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            data-testid="nav-toggle"
          >
            {open ? '✕' : '☰'}
          </button>
          <button
            className="theme-toggle"
            aria-label="Toggle dark mode"
            onClick={() => setDark((d) => !d)}
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {/* Mobile menu - accessible */}
      <nav
        className={`mobile-nav md:hidden ${open ? 'block' : 'hidden'}`}
        aria-hidden={!open}
        aria-label="Mobile"
      >
        <div className="container mobile-nav__inner py-4">
          <a href="/portfolio" ref={firstLinkRef} data-testid="mobile-portfolio">Portfolio</a>
          <a href="/contact" data-testid="mobile-contact">Contact</a>
          <a href="/about" data-testid="mobile-about">About</a>
          <a href="/contact" className="btn btn--primary mt-2" data-testid="mobile-book">Book</a>
        </div>
      </nav>
    </header>
  );
}
