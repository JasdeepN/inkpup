"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  // Dark mode toggle
  const [dark, setDark] = useState(true);
  // Mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const pathname = usePathname();

  return (
    <header className="sticky-header">
      <div className="nav-shell">
        <div className="sticky-nav flex items-center gap-6 w-full">
          <Link href="/" className="nav-brand font-semibold text-lg">
            InkPup
          </Link>
          {/* Primary navigation (desktop) */}
          <nav
            className="admin-nav hidden md:flex items-center gap-6"
            aria-label="Primary"
            aria-hidden={mobileOpen ? 'true' : 'false'}
          >
            <Link href="/flash" className="nav-link">Flash Available</Link>
            <Link href="/custom-design" className="nav-link">Custom Work</Link>
            <Link href="/portfolio" className="nav-link">Portfolio</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
            <Link href="/about" className="nav-link">About</Link>
          </nav>
          <div className="flex items-center gap-4 header-actions ml-auto">
            <Link href="/contact" className="btn btn--primary hidden md:inline-flex">
              Book Now
            </Link>
            <button
              type="button"
              aria-label="Toggle dark mode"
              className="text-2xl hover:text-accent transition-colors"
              onClick={() => setDark((d) => !d)}
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
            <Link href="/flash" className="nav-link" onClick={() => setMobileOpen(false)}>Flash Available</Link>
            <Link href="/custom-design" className="nav-link" onClick={() => setMobileOpen(false)}>Custom Work</Link>
            <Link href="/portfolio" className="nav-link" onClick={() => setMobileOpen(false)}>Portfolio</Link>
            <Link href="/pricing" className="nav-link" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link href="/contact" className="nav-link" onClick={() => setMobileOpen(false)}>Contact</Link>
            <Link href="/about" className="nav-link" onClick={() => setMobileOpen(false)}>About</Link>
            <Link href="/contact" className="btn btn--primary mt-2" onClick={() => setMobileOpen(false)}>Book Now</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
