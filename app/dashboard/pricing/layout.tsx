import type { ReactNode } from 'react';
import { getD1Binding } from '../../../lib/db/d1';
import { D1UnavailableNotice } from '../../../components/admin/D1UnavailableNotice';
import PricingNav from './PricingNav';

export default async function PricingLayout({ children }: { children: ReactNode }) {
  // Check D1 binding on server side
  const db = getD1Binding();
  const isD1Available = !!db;

  return (
    <div>
      <D1UnavailableNotice 
        isAvailable={isD1Available}
        affectedFeatures={[
          'Pricing data editing',
          'Style multiplier updates', 
          'Size category management',
          'Color profile configuration'
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Pricing Management</h1>
        <PricingNav />
      </div>
      {children}
    </div>
  );
}
