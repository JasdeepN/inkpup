import { Suspense } from 'react';
import Link from 'next/link';
import { getCustomersAction } from '@/lib/admin-actions-customers';
import CustomerListPage from '@/components/admin/CustomerListPage';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { customers, error } = await getCustomersAction();

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <div className="admin-header mb-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">👥 Customers</h1>
            <Link href="/dashboard/customers/new" className="btn btn--primary btn--sm">
              + Add Customer
            </Link>
          </div>
        </div>

        {error ? (
          <div className="inquiry-error">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <Suspense fallback={<CustomerListSkeleton />}>
            <CustomerListPage customers={customers} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function CustomerListSkeleton() {
  return (
    <div className="customer-list">
      {[1, 2, 3].map((i) => (
        <div key={i} className="customer-item customer-item--skeleton">
          <div className="customer-item__main">
            <div className="skeleton skeleton--text skeleton--name" />
            <div className="skeleton skeleton--text skeleton--email" />
          </div>
        </div>
      ))}
    </div>
  );
}
