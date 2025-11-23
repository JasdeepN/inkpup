import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="admin-card admin-nav admin-card--compact flex items-center justify-between mb-6" aria-label="Admin navigation">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-semibold text-lg">
          ADMIN
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-accent transition-colors">
            Dashboard
          </Link>
          <Link href="/gallery" className="hover:text-accent transition-colors">
            Gallery
          </Link>
          <Link href="/uploads" className="hover:text-accent transition-colors">
            Uploads
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/diagnostics" className="text-sm hover:text-accent transition-colors">
          Diagnostics
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="text-sm hover:text-accent transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
