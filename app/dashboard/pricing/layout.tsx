import type { ReactNode } from 'react';
import { getD1Binding, getSizeCategories, getStyles, getColorProfiles } from '../../../lib/db/d1';
import { D1UnavailableNotice } from '../../../components/admin/D1UnavailableNotice';
import PricingNav from './PricingNav';
import PriceBreakdownPreview from '../../../components/admin/PriceBreakdownPreview';
import type { SizeCategory, Style, ColorProfile } from '../../../types/cloudflare.d';

export default async function PricingLayout({ children }: { children: ReactNode }) {
  // Check D1 binding on server side
  const db = getD1Binding();
  const isD1Available = !!db;

  // Fetch pricing data for preview panel
  let sizes: SizeCategory[] = [];
  let styles: Style[] = [];
  let colors: ColorProfile[] = [];

  if (db) {
    try {
      [sizes, styles, colors] = await Promise.all([
        getSizeCategories(db),
        getStyles(db),
        getColorProfiles(db),
      ]);
    } catch (error) {
      console.error('[PricingLayout] Error fetching pricing data:', error);
    }
  }

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
      
      {/* Price Breakdown Preview Panel */}
      {isD1Available && sizes.length > 0 && styles.length > 0 && colors.length > 0 && (
        <PriceBreakdownPreview
          sizes={sizes}
          styles={styles}
          colors={colors}
        />
      )}
      
      {children}
    </div>
  );
}
