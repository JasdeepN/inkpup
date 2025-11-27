import TemplateEditor from '@/components/admin/TemplateEditor';

export const dynamic = 'force-dynamic';

export default function NewTemplatePage() {
  return (
    <div className="admin-shell">
      <div className="admin-card">
        <TemplateEditor mode="create" />
      </div>
    </div>
  );
}
