/**
 * Zod schemas for inquiry inbox and email templates
 * @module lib/schemas/inquiry
 */
import { z } from 'zod';

// ============================================
// Enums
// ============================================

export const InquiryStatusSchema = z.enum([
  'unread',
  'read', 
  'replied',
  'booked',
  'archived'
]);

export const InquiryTypeSchema = z.enum([
  'contact',
  'flash',
  'custom'
]);

// ============================================
// Inquiry Schemas
// ============================================

export const InquirySchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),
  inquiry_type: InquiryTypeSchema,
  design_id: z.string().nullable(),
  message: z.string().nullable(),
  placement: z.string().nullable(),
  budget: z.string().nullable(),
  status: InquiryStatusSchema,
  created_at: z.string(),
  replied_at: z.string().nullable(),
  notes: z.string().nullable(),
});

export const CreateInquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  inquiry_type: InquiryTypeSchema.optional().default('contact'),
  design_id: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  placement: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
});

export const UpdateInquiryStatusSchema = z.object({
  id: z.number(),
  status: InquiryStatusSchema,
});

export const UpdateInquiryNotesSchema = z.object({
  id: z.number(),
  notes: z.string(),
});

// ============================================
// Email Template Schemas
// ============================================

export const EmailTemplateSchema = z.object({
  id: z.number(),
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  is_default: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export const CreateTemplateSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_]+$/, 'Slug must be lowercase letters, numbers, and underscores only'),
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  body: z.string().min(1, 'Body is required').optional(),
});

// ============================================
// Inquiry Email Schemas (sent messages log)
// ============================================

export const InquiryEmailSchema = z.object({
  id: z.number(),
  inquiry_id: z.number(),
  template_id: z.number().nullable(),
  subject: z.string(),
  body: z.string(),
  sent_at: z.string(),
});

export const CreateInquiryEmailSchema = z.object({
  inquiry_id: z.number(),
  template_id: z.number().optional().nullable(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

// ============================================
// Reply Schema (for sending emails)
// ============================================

export const SendReplySchema = z.object({
  inquiry_id: z.number(),
  template_id: z.number().optional().nullable(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  // Variable values for template rendering
  variables: z.record(z.string(), z.string()).optional(),
});

// ============================================
// Types
// ============================================

export type Inquiry = z.infer<typeof InquirySchema>;
export type CreateInquiry = z.infer<typeof CreateInquirySchema>;
export type InquiryStatus = z.infer<typeof InquiryStatusSchema>;
export type InquiryType = z.infer<typeof InquiryTypeSchema>;

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplate = z.infer<typeof UpdateTemplateSchema>;

export type InquiryEmail = z.infer<typeof InquiryEmailSchema>;
export type CreateInquiryEmail = z.infer<typeof CreateInquiryEmailSchema>;
export type SendReply = z.infer<typeof SendReplySchema>;

// ============================================
// Utility: Template variable substitution
// ============================================

/**
 * Replace {{variable}} placeholders in template with actual values
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

/**
 * Extract variable names from template
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
}

/**
 * Sample data for template preview
 */
export const SAMPLE_TEMPLATE_DATA: Record<string, string> = {
  name: 'John Doe',
  email: 'john@example.com',
  design: 'Wolf Design #123',
  amount: '100',
  date: 'December 15, 2025',
  time: '2:00 PM',
  phone: '(416) 555-1234',
};
