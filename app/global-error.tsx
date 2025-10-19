'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global application error encountered', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <main className="container py-16" id="content">
        <section className="prose prose-invert max-w-3xl">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="text-lg text-muted">
            We couldn&rsquo;t load this page because an unexpected error occurred. You can try reloading or return to the homepage while we look into it.
          </p>
          {error?.digest && (
            <p className="text-sm text-muted">
              Error reference: <code>{error.digest}</code>
            </p>
          )}
          <div className="mt-6 flex gap-4">
            <button type="button" className="btn btn--primary" onClick={() => reset()}>
              Try again
            </button>
            <Link href="/" className="btn btn--secondary">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
