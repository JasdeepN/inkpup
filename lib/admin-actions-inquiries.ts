'use server';

import { revalidatePath } from 'next/cache';
import { getD1Binding } from './db/d1';
import {
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  updateInquiryNotes,
  deleteInquiry,
  getUnreadCount,
} from './db/inquiries';
import { getTemplates, getTemplateById } from './db/email-templates';
import { createInquiryEmail, getEmailsByInquiryId } from './db/inquiry-emails';
import {
  InquiryStatusSchema,
  renderTemplate,
  type InquiryStatus,
  type Inquiry,
  type InquiryEmail,
  type EmailTemplate,
} from './schemas/inquiry';
import { Resend } from 'resend';

// ============================================
// Types
// ============================================

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type InquiryWithEmails = Inquiry & {
  emails: InquiryEmail[];
};

// ============================================
// Read Actions
// ============================================

/**
 * Get all inquiries with optional status filter
 */
export async function getInquiriesAction(
  status?: InquiryStatus | 'all'
): Promise<{ inquiries: Inquiry[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { inquiries: [], error: 'Database not available' };
  }

  const inquiries = await getInquiries(db, status);
  return { inquiries };
}

/**
 * Get a single inquiry with its email history
 */
export async function getInquiryAction(
  id: number
): Promise<{ inquiry: InquiryWithEmails | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { inquiry: null, error: 'Database not available' };
  }

  const inquiry = await getInquiryById(db, id);
  if (!inquiry) {
    return { inquiry: null, error: 'Inquiry not found' };
  }

  const emails = await getEmailsByInquiryId(db, id);
  return { inquiry: { ...inquiry, emails } };
}

/**
 * Get unread inquiry count for badge
 */
export async function getUnreadCountAction(): Promise<number> {
  const db = getD1Binding();
  if (!db) return 0;
  return getUnreadCount(db);
}

/**
 * Get all templates for reply dropdown
 */
export async function getTemplatesForReplyAction(): Promise<EmailTemplate[]> {
  const db = getD1Binding();
  if (!db) return [];
  return getTemplates(db);
}

// ============================================
// Update Actions
// ============================================

/**
 * Update inquiry status
 */
export async function updateInquiryStatusAction(
  id: number,
  status: InquiryStatus
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  // Validate status
  const parsed = InquiryStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: 'Invalid status' };
  }

  const success = await updateInquiryStatus(db, id, parsed.data);
  if (!success) {
    return { error: 'Failed to update status' };
  }

  revalidatePath('/dashboard/inquiries');
  return { success: 'Status updated' };
}

/**
 * Update inquiry notes
 */
export async function updateInquiryNotesAction(
  id: number,
  notes: string
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const success = await updateInquiryNotes(db, id, notes);
  if (!success) {
    return { error: 'Failed to update notes' };
  }

  revalidatePath('/dashboard/inquiries');
  return { success: 'Notes updated' };
}

/**
 * Delete an inquiry
 */
export async function deleteInquiryAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const success = await deleteInquiry(db, id);
  if (!success) {
    return { error: 'Failed to delete inquiry' };
  }

  revalidatePath('/dashboard/inquiries');
  return { success: 'Inquiry deleted' };
}

// ============================================
// Reply Actions
// ============================================

/**
 * Send a reply email to an inquiry
 */
export async function sendReplyAction(
  inquiryId: number,
  templateId: number | null,
  subject: string,
  body: string,
  variables?: Record<string, string>
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  // Get the inquiry
  const inquiry = await getInquiryById(db, inquiryId);
  if (!inquiry) {
    return { error: 'Inquiry not found' };
  }

  // Render template variables
  const inquiryVars: Record<string, string> = {
    name: inquiry.name,
    email: inquiry.email,
    design: inquiry.design_id || 'your design',
    ...variables,
  };

  const renderedSubject = renderTemplate(subject, inquiryVars);
  const renderedBody = renderTemplate(body, inquiryVars);

  // Send email via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { error: 'Email service not configured' };
  }

  try {
    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: 'InkPup <contact@mail.inkpup.ca>',
      to: [inquiry.email],
      subject: renderedSubject,
      text: renderedBody,
    });

    if (sendError) {
      console.error('❌ Resend error:', sendError);
      return { error: 'Failed to send email' };
    }

    // Log the sent email
    await createInquiryEmail(db, {
      inquiry_id: inquiryId,
      template_id: templateId,
      subject: renderedSubject,
      body: renderedBody,
    });

    // Update inquiry status to replied
    await updateInquiryStatus(db, inquiryId, 'replied');

    console.log('✅ Reply sent to:', inquiry.email);
    revalidatePath('/dashboard/inquiries');
    return { success: 'Reply sent successfully' };
  } catch (error) {
    console.error('❌ Send reply error:', error);
    return { error: 'Failed to send email' };
  }
}

/**
 * Send a reply using a template
 */
export async function sendTemplateReplyAction(
  inquiryId: number,
  templateId: number,
  customVariables?: Record<string, string>
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  // Get the template
  const template = await getTemplateById(db, templateId);
  if (!template) {
    return { error: 'Template not found' };
  }

  return sendReplyAction(
    inquiryId,
    templateId,
    template.subject,
    template.body,
    customVariables
  );
}
