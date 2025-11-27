'use client';

import { useState, useTransition } from 'react';
import type { Inquiry, EmailTemplate } from '@/lib/schemas/inquiry';
import { renderTemplate, extractTemplateVariables, SAMPLE_TEMPLATE_DATA } from '@/lib/schemas/inquiry';
import { sendReplyAction } from '@/lib/admin-actions-inquiries';

interface InquiryReplyFormProps {
  inquiry: Inquiry;
  templates: EmailTemplate[];
  onCancel: () => void;
  onSent: () => void;
}

export default function InquiryReplyForm({
  inquiry,
  templates,
  onCancel,
  onSent,
}: InquiryReplyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({
    amount: '100',
    date: '',
    time: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Build variables from inquiry data
  const inquiryVariables: Record<string, string> = {
    name: inquiry.name,
    email: inquiry.email,
    design: inquiry.design_id || 'your design',
    phone: inquiry.phone || '',
    ...customVariables,
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedTemplateId(templateId);

    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    } else {
      setSubject('');
      setBody('');
    }
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    startTransition(async () => {
      const result = await sendReplyAction(
        inquiry.id,
        selectedTemplateId,
        subject,
        body,
        customVariables
      );

      if (result?.error) {
        setError(result.error);
      } else {
        onSent();
      }
    });
  };

  // Extract variables from current body
  const usedVariables = extractTemplateVariables(body);
  const needsCustomVars = usedVariables.some((v) => ['amount', 'date', 'time'].includes(v));

  // Rendered preview
  const previewSubject = renderTemplate(subject, inquiryVariables);
  const previewBody = renderTemplate(body, inquiryVariables);

  return (
    <div className="inquiry-reply-form">
      <h4 className="inquiry-reply-form__title">Send Reply to {inquiry.name}</h4>

      {error && (
        <div className="inquiry-message inquiry-message--error">{error}</div>
      )}

      {/* Template Selector */}
      <div className="inquiry-reply-form__field">
        <label htmlFor="template">Template</label>
        <select
          id="template"
          value={selectedTemplateId ?? ''}
          onChange={handleTemplateSelect}
          className="inquiry-reply-form__select"
        >
          <option value="">Custom Message</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Variables (if template uses them) */}
      {needsCustomVars && (
        <div className="inquiry-reply-form__variables">
          <h5>Fill in Variables</h5>
          <div className="inquiry-reply-form__var-grid">
            {usedVariables.includes('amount') && (
              <div className="inquiry-reply-form__var">
                <label htmlFor="var-amount">Amount ($)</label>
                <input
                  id="var-amount"
                  type="text"
                  value={customVariables.amount}
                  onChange={(e) => setCustomVariables({ ...customVariables, amount: e.target.value })}
                  placeholder="100"
                />
              </div>
            )}
            {usedVariables.includes('date') && (
              <div className="inquiry-reply-form__var">
                <label htmlFor="var-date">Date</label>
                <input
                  id="var-date"
                  type="text"
                  value={customVariables.date}
                  onChange={(e) => setCustomVariables({ ...customVariables, date: e.target.value })}
                  placeholder="December 15, 2025"
                />
              </div>
            )}
            {usedVariables.includes('time') && (
              <div className="inquiry-reply-form__var">
                <label htmlFor="var-time">Time</label>
                <input
                  id="var-time"
                  type="text"
                  value={customVariables.time}
                  onChange={(e) => setCustomVariables({ ...customVariables, time: e.target.value })}
                  placeholder="2:00 PM"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="inquiry-reply-form__field">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="inquiry-reply-form__input"
          placeholder="Email subject..."
        />
      </div>

      {/* Body */}
      <div className="inquiry-reply-form__field">
        <label htmlFor="body">Message</label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="inquiry-reply-form__textarea"
          rows={10}
          placeholder="Type your message..."
        />
        <p className="inquiry-reply-form__hint text-muted">
          Variables: {'{{name}}'}, {'{{email}}'}, {'{{design}}'}, {'{{amount}}'}, {'{{date}}'}, {'{{time}}'}
        </p>
      </div>

      {/* Preview Toggle */}
      <button
        type="button"
        className="btn btn--sm btn--outline mb-4"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>

      {/* Preview */}
      {showPreview && (
        <div className="inquiry-reply-form__preview">
          <h5>Preview (as recipient will see)</h5>
          <div className="inquiry-reply-form__preview-content">
            <p className="inquiry-reply-form__preview-subject">
              <strong>Subject:</strong> {previewSubject}
            </p>
            <div className="inquiry-reply-form__preview-body">
              {previewBody.split('\n').map((line, i) => (
                <p key={i}>{line || <br />}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="inquiry-reply-form__actions">
        <button
          type="button"
          className="btn btn--outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSend}
          disabled={isPending || !subject.trim() || !body.trim()}
        >
          {isPending ? 'Sending...' : '✉️ Send Reply'}
        </button>
      </div>
    </div>
  );
}
