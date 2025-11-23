'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * ConditionalHeader - Only shows public header on non-admin routes
 * Admin routes (/dashboard, /gallery, /uploads) use AdminNav instead
 */
export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on admin routes
  const isAdminRoute = pathname?.startsWith('/dashboard') || 
                       pathname?.startsWith('/gallery') || 
                       pathname?.startsWith('/uploads');
  
  if (isAdminRoute) {
    return null;
  }
  
  return <Header />;
}
