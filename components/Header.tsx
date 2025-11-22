"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '../lib/admin-actions';

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

  // Close mobile menu when navigation occurs
  const handleNavClick = () => {
    setOpen(false);
  };

  // Dark mode toggle
  const [dark, setDark] = useState(true);
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the current host is an admin host (e.g., admin.inkpup.com)
    const adminHostPattern = /^admin\./i;
    const isAdminHost = typeof window !== 'undefined' && adminHostPattern.test(window.location.hostname);
    setIsAdmin(isAdminHost || Boolean(pathname && pathname.startsWith('/admin')));
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="site-header__brand">
          <Link href="/" className="text-2xl font-bold flex items-baseline gap-2" data-testid="site-logo">
            InkPup
            {isAdmin && (
              <sup className="ml-1 text-xs font-semibold text-pink-400 align-super" aria-label="Admin console" title="Admin console">ADMIN</sup>
            )}
          </Link>
          <nav className="primary-nav hidden md:flex" aria-label="Primary">
            {isAdmin ? (
              <>
                <Link href="/dashboard" data-testid="nav-admin-dashboard">Dashboard</Link>
                <Link href="/gallery" data-testid="nav-admin-gallery">Gallery</Link>
                <Link href="/uploads" data-testid="nav-admin-uploads">Uploads</Link>
              </>
            ) : (
              <>
                <Link href="/flash" data-testid="nav-flash">Flash Available</Link>
                <Link href="/custom-design" data-testid="nav-custom">Custom Work</Link>
                <Link href="/portfolio" data-testid="nav-portfolio">Portfolio</Link>
                <Link href="/pricing" data-testid="nav-pricing">Pricing</Link>
                <Link href="/contact" data-testid="nav-contact">Contact</Link>
                <Link href="/about" data-testid="nav-about">About</Link>
              </>
            )}
          </nav>
        </div>

        <div className="header-actions">
          {isAdmin ? (
            <form action={logoutAction}>
              <button type="submit" name="logout" className="btn btn--secondary" data-testid="nav-logout">Sign out</button>
            </form>
          ) : (
            <Link href="/contact" className="btn btn--primary" data-testid="nav-book">Book</Link>
          )}
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
          {isAdmin ? (
            <>
              <Link href="/dashboard" ref={firstLinkRef} onClick={handleNavClick} data-testid="mobile-admin-dashboard">Dashboard</Link>
              <Link href="/gallery" onClick={handleNavClick} data-testid="mobile-admin-gallery">Gallery</Link>
              <Link href="/uploads" onClick={handleNavClick} data-testid="mobile-admin-uploads">Uploads</Link>
              <form action={logoutAction} className="mt-2">
                <button type="submit" name="logout" className="btn btn--secondary w-full" data-testid="mobile-logout">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/flash" ref={firstLinkRef} onClick={handleNavClick} data-testid="mobile-flash">Flash Available</Link>
              <Link href="/custom-design" onClick={handleNavClick} data-testid="mobile-custom">Custom Work</Link>
              <Link href="/portfolio" onClick={handleNavClick} data-testid="mobile-portfolio">Portfolio</Link>
              <Link href="/pricing" onClick={handleNavClick} data-testid="mobile-pricing">Pricing</Link>
              <Link href="/contact" onClick={handleNavClick} data-testid="mobile-contact">Contact</Link>
              <Link href="/about" onClick={handleNavClick} data-testid="mobile-about">About</Link>
              <Link href="/contact" className="btn btn--primary mt-2" onClick={handleNavClick} data-testid="mobile-book">Book</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
