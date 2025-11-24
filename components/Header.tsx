"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  // Dark mode toggle
  const [dark, setDark] = useState(true);
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  const pathname = usePathname();

  return (
    <header className="sticky-header">
    <div className="nav-shell">
    <nav className="admin-nav admin-card--compact flex items-center justify-between mb-6 sticky-nav" aria-label="Main navigation">
      <div className="flex items-center gap-6">
        <Link href="/" className="nav-brand font-semibold text-lg">
          InkPup
        </Link>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/flash" className="nav-link">
            Flash
          </Link>
          <Link href="/custom-design" className="nav-link">
            Custom
          </Link>
          <Link href="/portfolio" className="nav-link">
            Portfolio
          </Link>
          <Link href="/pricing" className="nav-link">
            Pricing
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/contact" className="btn btn--primary hidden md:inline-flex">
          Book Now
        </Link>
        <button
          className="text-2xl hover:text-accent transition-colors"
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
        >
          {dark ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
    </div>
    </header>
  );
}
