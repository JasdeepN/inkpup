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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold">InkPup</Link>
          <nav className="hidden md:flex gap-4 text-sm text-gray-700" aria-label="Primary">
            <Link href="/portfolio" className="hover:underline">Portfolio</Link>
            <Link href="/services" className="hover:underline">Services</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/contact" className="btn btn--primary">Book</Link>
          <button
            className="md:hidden p-2 rounded-md border"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu - accessible */}
      <nav
        className={`md:hidden bg-white border-t border-gray-200 ${open ? 'block' : 'hidden'}`}
        aria-hidden={!open}
        aria-label="Mobile"
      >
        <div className="container py-4 flex flex-col gap-3">
          <a href="/portfolio" ref={firstLinkRef} className="text-base">Portfolio</a>
          <a href="/services" className="text-base">Services</a>
          <a href="/contact" className="text-base">Contact</a>
          <a href="/contact" className="btn btn--primary mt-2">Book</a>
        </div>
      </nav>
    </header>
  );
}
