import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = false;

export default function NotFound() {
  return (
    <main className="container py-16" id="content">
      <section className="prose prose-invert max-w-3xl">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-lg text-muted">
          The page you are looking for doesn&rsquo;t exist or may have been moved. Try heading back to the homepage or use the site navigation to find what you need.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link href="/contact" className="btn btn--secondary">
            Contact the studio
          </Link>
        </div>
      </section>
    </main>
  );
}
