/**
 * D1UnavailableNotice - Informs admin users when D1 is unavailable
 * 
 * D1 bindings are only available when running in Cloudflare Workers.
 * In local development (next dev), D1 is not accessible and the
 * system falls back to JSON data.
 */

'use client';

import { useState } from 'react';

interface D1UnavailableNoticeProps {
  /** Set to true when D1 is available */
  isAvailable?: boolean;
  /** Additional context about what features are affected */
  affectedFeatures?: string[];
}

export function D1UnavailableNotice({ 
  isAvailable = false,
  affectedFeatures = ['pricing data', 'hero image selection']
}: D1UnavailableNoticeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Don't show if D1 is available or already dismissed
  if (isAvailable || isDismissed) {
    return null;
  }
  
  return (
    <div className="mb-4 p-4 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
            Database Not Available (Local Development)
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            D1 database bindings are only available when running in Cloudflare Workers.
            You&apos;re currently in local development mode, so the following features use fallback data:
          </p>
          <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
            {affectedFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            Deploy to Cloudflare Workers or use <code className="px-1 py-0.5 rounded bg-yellow-100 dark:bg-yellow-800/50">wrangler pages dev</code> for full functionality.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
          aria-label="Dismiss notice"
        >
          <svg
            className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
