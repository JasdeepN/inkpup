/**
 * Tests for inquiry schemas
 * @module lib/schemas/inquiry.test
 */
import {
  InquirySchema,
  CreateInquirySchema,
  EmailTemplateSchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  InquiryStatusSchema,
  InquiryTypeSchema,
  renderTemplate,
  extractTemplateVariables,
  SAMPLE_TEMPLATE_DATA,
} from './inquiry';

describe('InquiryStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(InquiryStatusSchema.parse('unread')).toBe('unread');
    expect(InquiryStatusSchema.parse('read')).toBe('read');
    expect(InquiryStatusSchema.parse('replied')).toBe('replied');
    expect(InquiryStatusSchema.parse('booked')).toBe('booked');
    expect(InquiryStatusSchema.parse('archived')).toBe('archived');
  });

  it('rejects invalid statuses', () => {
    expect(() => InquiryStatusSchema.parse('invalid')).toThrow();
    expect(() => InquiryStatusSchema.parse('')).toThrow();
  });
});

describe('InquiryTypeSchema', () => {
  it('accepts valid types', () => {
    expect(InquiryTypeSchema.parse('contact')).toBe('contact');
    expect(InquiryTypeSchema.parse('flash')).toBe('flash');
    expect(InquiryTypeSchema.parse('custom')).toBe('custom');
  });

  it('rejects invalid types', () => {
    expect(() => InquiryTypeSchema.parse('invalid')).toThrow();
  });
});

describe('InquirySchema', () => {
  const validInquiry = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    inquiry_type: 'flash',
    design_id: 'wolf-01',
    message: 'I want this design',
    placement: 'forearm',
    budget: '$200-300',
    status: 'unread',
    created_at: '2025-11-26T10:00:00Z',
    replied_at: null,
    notes: null,
  };

  it('validates a complete inquiry', () => {
    const result = InquirySchema.parse(validInquiry);
    expect(result.name).toBe('John Doe');
    expect(result.status).toBe('unread');
  });

  it('accepts nullable fields', () => {
    const inquiry = {
      ...validInquiry,
      phone: null,
      design_id: null,
      message: null,
      placement: null,
      budget: null,
      notes: null,
    };
    const result = InquirySchema.parse(inquiry);
    expect(result.phone).toBeNull();
  });

  it('rejects invalid email', () => {
    const inquiry = { ...validInquiry, email: 'not-an-email' };
    expect(() => InquirySchema.parse(inquiry)).toThrow();
  });

  it('rejects empty name', () => {
    const inquiry = { ...validInquiry, name: '' };
    expect(() => InquirySchema.parse(inquiry)).toThrow();
  });
});

describe('CreateInquirySchema', () => {
  it('validates minimal inquiry creation', () => {
    const result = CreateInquirySchema.parse({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(result.name).toBe('Jane Doe');
    expect(result.inquiry_type).toBe('contact'); // default
  });

  it('validates full inquiry creation', () => {
    const result = CreateInquirySchema.parse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-5678',
      inquiry_type: 'custom',
      design_id: null,
      message: 'Custom piece request',
      placement: 'back',
      budget: '$500+',
    });
    expect(result.inquiry_type).toBe('custom');
    expect(result.budget).toBe('$500+');
  });

  it('rejects missing required fields', () => {
    expect(() => CreateInquirySchema.parse({ name: 'Test' })).toThrow();
    expect(() => CreateInquirySchema.parse({ email: 'test@test.com' })).toThrow();
  });
});

describe('EmailTemplateSchema', () => {
  const validTemplate = {
    id: 1,
    slug: 'deposit_request',
    name: 'Deposit Request',
    subject: 'Deposit Required - {{name}}',
    body: 'Hi {{name}}, please send ${{amount}}',
    is_default: 1,
    created_at: '2025-11-26T10:00:00Z',
    updated_at: null,
  };

  it('validates a complete template', () => {
    const result = EmailTemplateSchema.parse(validTemplate);
    expect(result.slug).toBe('deposit_request');
    expect(result.is_default).toBe(1);
  });

  it('rejects empty slug', () => {
    const template = { ...validTemplate, slug: '' };
    expect(() => EmailTemplateSchema.parse(template)).toThrow();
  });
});

describe('CreateTemplateSchema', () => {
  it('validates template creation', () => {
    const result = CreateTemplateSchema.parse({
      slug: 'custom_template',
      name: 'Custom Template',
      subject: 'Hello {{name}}',
      body: 'Dear {{name}}, this is a custom message.',
    });
    expect(result.slug).toBe('custom_template');
  });

  it('rejects invalid slug format', () => {
    expect(() =>
      CreateTemplateSchema.parse({
        slug: 'Invalid Slug!',
        name: 'Test',
        subject: 'Test',
        body: 'Test',
      })
    ).toThrow();
  });

  it('accepts valid slug formats', () => {
    const result = CreateTemplateSchema.parse({
      slug: 'valid_slug_123',
      name: 'Test',
      subject: 'Test',
      body: 'Test',
    });
    expect(result.slug).toBe('valid_slug_123');
  });
});

describe('UpdateTemplateSchema', () => {
  it('allows partial updates', () => {
    const result = UpdateTemplateSchema.parse({ name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(result.subject).toBeUndefined();
  });

  it('validates all fields when provided', () => {
    const result = UpdateTemplateSchema.parse({
      name: 'Updated',
      subject: 'New Subject',
      body: 'New body content',
    });
    expect(result.name).toBe('Updated');
    expect(result.body).toBe('New body content');
  });
});

describe('renderTemplate', () => {
  it('replaces single variable', () => {
    const result = renderTemplate('Hello {{name}}!', { name: 'John' });
    expect(result).toBe('Hello John!');
  });

  it('replaces multiple variables', () => {
    const template = 'Hi {{name}}, your appointment is on {{date}} at {{time}}.';
    const vars = { name: 'Jane', date: 'Dec 15', time: '2pm' };
    const result = renderTemplate(template, vars);
    expect(result).toBe('Hi Jane, your appointment is on Dec 15 at 2pm.');
  });

  it('handles missing variables gracefully', () => {
    const result = renderTemplate('Hello {{name}}, amount: {{amount}}', { name: 'John' });
    expect(result).toBe('Hello John, amount: ');
  });

  it('handles no variables', () => {
    const result = renderTemplate('No variables here', {});
    expect(result).toBe('No variables here');
  });

  it('handles repeated variables', () => {
    const result = renderTemplate('{{name}} said hello. Bye {{name}}!', { name: 'Alice' });
    expect(result).toBe('Alice said hello. Bye Alice!');
  });
});

describe('extractTemplateVariables', () => {
  it('extracts single variable', () => {
    const vars = extractTemplateVariables('Hello {{name}}');
    expect(vars).toEqual(['name']);
  });

  it('extracts multiple unique variables', () => {
    const vars = extractTemplateVariables('{{name}} on {{date}} at {{time}}');
    expect(vars).toContain('name');
    expect(vars).toContain('date');
    expect(vars).toContain('time');
    expect(vars.length).toBe(3);
  });

  it('deduplicates repeated variables', () => {
    const vars = extractTemplateVariables('{{name}} and {{name}} again');
    expect(vars).toEqual(['name']);
  });

  it('returns empty array for no variables', () => {
    const vars = extractTemplateVariables('No variables here');
    expect(vars).toEqual([]);
  });
});

describe('SAMPLE_TEMPLATE_DATA', () => {
  it('has all common variables', () => {
    expect(SAMPLE_TEMPLATE_DATA.name).toBeDefined();
    expect(SAMPLE_TEMPLATE_DATA.email).toBeDefined();
    expect(SAMPLE_TEMPLATE_DATA.design).toBeDefined();
    expect(SAMPLE_TEMPLATE_DATA.amount).toBeDefined();
    expect(SAMPLE_TEMPLATE_DATA.date).toBeDefined();
    expect(SAMPLE_TEMPLATE_DATA.time).toBeDefined();
  });
});
