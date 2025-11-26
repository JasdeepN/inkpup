'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pricingLinks = [
  { href: '/dashboard/pricing', label: 'Overview' },
  { href: '/dashboard/pricing/styles', label: 'Styles' },
  { href: '/dashboard/pricing/sizes', label: 'Size Categories' },
  { href: '/dashboard/pricing/colors', label: 'Color Profiles' },
];

export default function PricingNav() {
  const pathname = usePathname();

  return (
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
  );
}
