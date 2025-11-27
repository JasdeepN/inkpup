import { notFound } from 'next/navigation';
import TemplateEditor from '@/components/admin/TemplateEditor';
import { getTemplateAction } from '@/lib/admin-actions-templates';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    notFound();
  }

  const { template, error } = await getTemplateAction(templateId);

  if (error || !template) {
    notFound();
  }

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <TemplateEditor mode="edit" template={template} />
      </div>
    </div>
  );
}
