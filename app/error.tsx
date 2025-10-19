'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App router error boundary triggered', error);
  }, [error]);

  return (
    <main className="container py-16" id="content">
      <section className="prose prose-invert max-w-3xl">
        <h1 className="text-3xl font-semibold">We hit a snag</h1>
        <p className="text-lg text-muted">
          Something broke while rendering this page. You can retry the request or head back to the homepage while we sort it out.
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
  );
}
