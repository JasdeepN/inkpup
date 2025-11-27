'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EmailTemplate } from '@/lib/schemas/inquiry';
import { renderTemplate, extractTemplateVariables, SAMPLE_TEMPLATE_DATA } from '@/lib/schemas/inquiry';
import { createTemplateAction, updateTemplateDirectAction } from '@/lib/admin-actions-templates';

interface TemplateEditorProps {
  mode: 'create' | 'edit';
  template?: EmailTemplate;
}

export default function TemplateEditor({ mode, template }: TemplateEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [slug, setSlug] = useState(template?.slug || '');
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isDefault = template?.is_default === 1;

  // Extract variables used in template
  const usedVariables = [
    ...extractTemplateVariables(subject),
    ...extractTemplateVariables(body),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  // Preview rendering
  const previewSubject = renderTemplate(subject, SAMPLE_TEMPLATE_DATA);
  const previewBody = renderTemplate(body, SAMPLE_TEMPLATE_DATA);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (mode === 'create') {
        const formData = new FormData();
        formData.set('slug', slug);
        formData.set('name', name);
        formData.set('subject', subject);
        formData.set('body', body);

        const result = await createTemplateAction(null, formData);
        if (result?.error) {
          setError(result.error);
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
        } else {
          router.push('/dashboard/templates');
        }
      } else if (template) {
        const result = await updateTemplateDirectAction(template.id, {
          name,
          subject,
          body,
        });
        if (result?.error) {
          setError(result.error);
        } else {
          router.push('/dashboard/templates');
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="template-editor">
      <div className="template-editor__header">
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create Template' : `Edit: ${template?.name}`}
        </h1>
        <Link href="/dashboard/templates" className="btn btn--outline">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="inquiry-message inquiry-message--error">{error}</div>
      )}

      <div className="template-editor__form">
        {/* Slug (only for create) */}
        {mode === 'create' && (
          <div className="template-editor__field">
            <label htmlFor="slug">Slug (Internal ID)</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              className="inquiry-reply-form__input"
              placeholder="e.g., custom_greeting"
              required
            />
            {fieldErrors.slug && (
              <p className="template-editor__error">{fieldErrors.slug[0]}</p>
            )}
            <p className="inquiry-reply-form__hint text-muted">
              Lowercase letters, numbers, and underscores only. Cannot be changed later.
            </p>
          </div>
        )}

        {/* Name */}
        <div className="template-editor__field">
          <label htmlFor="name">Display Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="inquiry-reply-form__input"
            placeholder="e.g., Custom Greeting"
            required
          />
          {fieldErrors.name && (
            <p className="template-editor__error">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Subject */}
        <div className="template-editor__field">
          <label htmlFor="subject">Email Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="inquiry-reply-form__input"
            placeholder="e.g., Hello {{name}}! - InkPup"
            required
          />
          {fieldErrors.subject && (
            <p className="template-editor__error">{fieldErrors.subject[0]}</p>
          )}
        </div>

        {/* Body */}
        <div className="template-editor__field">
          <label htmlFor="body">Email Body</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="inquiry-reply-form__textarea"
            rows={15}
            placeholder="Type your template content here..."
            required
          />
          {fieldErrors.body && (
            <p className="template-editor__error">{fieldErrors.body[0]}</p>
          )}
        </div>

        {/* Variable Reference */}
        <div className="template-editor__variables">
          <h4>Available Variables</h4>
          <div className="template-editor__var-list">
            <code>{'{{name}}'}</code>
            <code>{'{{email}}'}</code>
            <code>{'{{design}}'}</code>
            <code>{'{{amount}}'}</code>
            <code>{'{{date}}'}</code>
            <code>{'{{time}}'}</code>
            <code>{'{{phone}}'}</code>
          </div>
          {usedVariables.length > 0 && (
            <p className="text-muted mt-2">
              Used in this template: {usedVariables.map(v => `{{${v}}}`).join(', ')}
            </p>
          )}
        </div>

        {/* Preview Toggle */}
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>

        {/* Preview */}
        {showPreview && (
          <div className="template-editor__preview">
            <h4>Preview (with sample data)</h4>
            <div className="template-editor__preview-content">
              <p className="template-editor__preview-subject">
                <strong>Subject:</strong> {previewSubject}
              </p>
              <div className="template-editor__preview-body">
                {previewBody.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="template-editor__actions">
          <Link href="/dashboard/templates" className="btn btn--outline">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isPending}
          >
            {isPending
              ? 'Saving...'
              : mode === 'create'
              ? 'Create Template'
              : 'Save Changes'}
          </button>
        </div>

        {isDefault && (
          <p className="text-muted text-center">
            This is a default template. You can edit it, but not delete it.
          </p>
        )}
      </div>
    </form>
  );
}
