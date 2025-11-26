/**
 * D1 Test Page - Validates database integration
 * This page demonstrates that D1 queries work in production
 */

import { getPricingData } from '../../lib/pricing';
import { getD1Binding } from '../../lib/db/d1';

export const dynamic = 'force-dynamic';

export default async function D1TestPage() {
  let pricingData;
  let error: string | null = null;
  let source = 'unknown';
  
  // Check if D1 binding is actually available
  const db = getD1Binding();
  const d1Available = !!db;

  try {
    pricingData = await getPricingData();
    // Check if data came from D1 or JSON fallback
    source = d1Available ? 'D1 Database' : 'JSON Fallback';
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
    source = 'Error';
  }

  return (
    <main className="container py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="glass-panel p-6">
          <h1 className="text-3xl font-bold mb-4">D1 Database Test</h1>
          <p className="text-muted mb-6">
            This page validates that Cloudflare D1 integration is working correctly.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-surface rounded">
              <h2 className="font-semibold mb-2">Data Source</h2>
              <p className="font-mono text-sm">{source}</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
                <h2 className="font-semibold text-red-500 mb-2">Error</h2>
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}

            {pricingData && (
              <>
                <div className="p-4 bg-surface rounded">
                  <h2 className="font-semibold mb-2">Size Categories</h2>
                  <p className="text-sm text-muted mb-2">Count: {pricingData.sizeCategories.length}</p>
                  <ul className="space-y-1 text-sm">
                    {pricingData.sizeCategories.slice(0, 3).map((cat) => (
                      <li key={cat.id} className="font-mono">
                        {cat.id}: {cat.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-surface rounded">
                  <h2 className="font-semibold mb-2">Styles</h2>
                  <p className="text-sm text-muted mb-2">Count: {pricingData.styles?.length || 0}</p>
                  <ul className="space-y-1 text-sm">
                    {pricingData.styles?.slice(0, 3).map((style) => (
                      <li key={style.id} className="font-mono">
                        {style.id}: {style.label} (×{style.multiplier})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-surface rounded">
                  <h2 className="font-semibold mb-2">Color Profiles</h2>
                  <p className="text-sm text-muted mb-2">Count: {pricingData.colorProfiles.length}</p>
                  <ul className="space-y-1 text-sm">
                    {pricingData.colorProfiles.slice(0, 3).map((color) => (
                      <li key={color.id} className="font-mono">
                        {color.id}: {color.label} (×{color.multiplier})
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-semibold">Runtime</dt>
              <dd className="font-mono text-muted">edge</dd>
            </div>
            <div>
              <dt className="font-semibold">D1 Binding Available</dt>
              <dd className={`font-mono ${d1Available ? 'text-green-500' : 'text-yellow-500'}`}>
                {d1Available ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">NODE_ENV</dt>
              <dd className="font-mono text-muted">{process.env.NODE_ENV}</dd>
            </div>
            <div>
              <dt className="font-semibold">ENABLE_D1_PRICING</dt>
              <dd className="font-mono text-muted">{process.env.ENABLE_D1_PRICING || 'not set'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
