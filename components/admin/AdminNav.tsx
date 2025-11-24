import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="admin-card admin-nav admin-card--compact flex items-center justify-between mb-6" aria-label="Admin navigation">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="nav-brand font-semibold text-lg">
          ADMIN
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/gallery" className="nav-link">
            Gallery
          </Link>
          <Link href="/uploads" className="nav-link">
            Uploads
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/diagnostics" className="nav-link">
          Diagnostics
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="nav-link">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
