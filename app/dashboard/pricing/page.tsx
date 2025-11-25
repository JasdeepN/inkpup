import Link from 'next/link';

export const metadata = {
  title: 'Pricing Management | Admin',
  description: 'Manage tattoo pricing: styles, sizes, and color profiles',
};

export default function PricingOverviewPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link
        href="/dashboard/pricing/styles"
        className="admin-card p-6 hover:border-accent transition-colors"
      >
        <h2 className="text-xl font-semibold mb-2">Styles</h2>
        <p className="text-gray-400">
          Manage tattoo styles with multipliers (e.g., Traditional, Realistic, Blackwork)
        </p>
      </Link>

      <Link
        href="/dashboard/pricing/sizes"
        className="admin-card p-6 hover:border-accent transition-colors"
      >
        <h2 className="text-xl font-semibold mb-2">Size Categories</h2>
        <p className="text-gray-400">
          Manage size tiers with price ranges (e.g., Small, Medium, Large)
        </p>
      </Link>

      <Link
        href="/dashboard/pricing/colors"
        className="admin-card p-6 hover:border-accent transition-colors"
      >
        <h2 className="text-xl font-semibold mb-2">Color Profiles</h2>
        <p className="text-gray-400">
          Manage color options with multipliers (e.g., Black &amp; Gray, Full Color)
        </p>
      </Link>
    </div>
  );
}
