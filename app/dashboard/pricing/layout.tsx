'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { D1UnavailableNotice } from '../../../components/admin/D1UnavailableNotice';

const pricingLinks = [
  { href: '/dashboard/pricing', label: 'Overview' },
  { href: '/dashboard/pricing/styles', label: 'Styles' },
  { href: '/dashboard/pricing/sizes', label: 'Size Categories' },
  { href: '/dashboard/pricing/colors', label: 'Color Profiles' },
];

export default function PricingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // In client component, we can't directly check D1 binding
  // The notice will show by default (isAvailable=false) since local dev doesn't have D1
  // When deployed to Cloudflare Workers, server-rendered pages will have D1 available
  // and the data will load correctly, making the notice moot
  return (
    <div>
      <D1UnavailableNotice 
        affectedFeatures={[
          'Pricing data editing',
          'Style multiplier updates', 
          'Size category management',
          'Color profile configuration'
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Pricing Management</h1>
        <nav className="flex gap-4 border-b border-gray-700 pb-2" aria-label="Pricing sections">
          {pricingLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-t transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
