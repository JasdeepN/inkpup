'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailTemplate } from '@/lib/schemas/inquiry';
import { deleteTemplateAction } from '@/lib/admin-actions-templates';

interface TemplateListProps {
  templates: EmailTemplate[];
}

export default function TemplateList({ templates }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="inquiry-empty">
        <div className="inquiry-empty__icon">📄</div>
        <h3>No templates yet</h3>
        <p className="text-muted">
          Create your first email template to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="template-list">
      {templates.map((template) => (
        <TemplateListItem key={template.id} template={template} />
      ))}
    </div>
  );
}

function TemplateListItem({ template }: { template: EmailTemplate }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isDefault = template.is_default === 1;

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    startTransition(async () => {
      const result = await deleteTemplateAction(template.id);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="template-item">
      <div className="template-item__content">
        <div className="template-item__header">
          <h3 className="template-item__name">{template.name}</h3>
          {isDefault && (
            <span className="template-item__badge">Default</span>
          )}
        </div>
        <p className="template-item__subject">{template.subject}</p>
        <p className="template-item__slug text-muted">
          Slug: <code>{template.slug}</code>
        </p>
      </div>

      <div className="template-item__actions">
        <Link
          href={`/dashboard/templates/${template.id}`}
          className="btn btn--sm btn--outline"
        >
          Edit
        </Link>
        {!isDefault && (
          <button
            type="button"
            className="btn btn--sm btn--outline btn--danger"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? '...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
