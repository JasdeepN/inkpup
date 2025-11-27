import { Suspense } from 'react';
import Link from 'next/link';
import TemplateList from '@/components/admin/TemplateList';
import { getTemplatesAction } from '@/lib/admin-actions-templates';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const { templates, error } = await getTemplatesAction();

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <div className="admin-header mb-6">
          <div>
            <h1 className="text-2xl font-bold">📝 Email Templates</h1>
            <p className="text-muted mt-1">
              Manage templates for inquiry replies. Variables like {'{{name}}'} are replaced automatically.
            </p>
          </div>
          <Link href="/dashboard/templates/new" className="btn btn--primary">
            + New Template
          </Link>
        </div>

        {error ? (
          <div className="inquiry-error">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <Suspense fallback={<TemplateListSkeleton />}>
            <TemplateList templates={templates} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function TemplateListSkeleton() {
  return (
    <div className="template-list">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="template-item template-item--skeleton">
          <div className="inquiry-item__skeleton-line inquiry-item__skeleton-line--medium" />
          <div className="inquiry-item__skeleton-line inquiry-item__skeleton-line--long" />
        </div>
      ))}
    </div>
  );
}
