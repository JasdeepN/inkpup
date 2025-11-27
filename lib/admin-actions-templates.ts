'use server';

import { revalidatePath } from 'next/cache';
import { getD1Binding } from './db/d1';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from './db/email-templates';
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  type EmailTemplate,
} from './schemas/inquiry';

// ============================================
// Types
// ============================================

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

// ============================================
// Read Actions
// ============================================

/**
 * Get all email templates
 */
export async function getTemplatesAction(): Promise<{
  templates: EmailTemplate[];
  error?: string;
}> {
  const db = getD1Binding();
  if (!db) {
    return { templates: [], error: 'Database not available' };
  }

  const templates = await getTemplates(db);
  return { templates };
}

/**
 * Get a single template by ID
 */
export async function getTemplateAction(
  id: number
): Promise<{ template: EmailTemplate | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { template: null, error: 'Database not available' };
  }

  const template = await getTemplateById(db, id);
  if (!template) {
    return { template: null, error: 'Template not found' };
  }

  return { template };
}

// ============================================
// Create Actions
// ============================================

/**
 * Create a new email template
 */
export async function createTemplateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    slug: formData.get('slug') as string,
    name: formData.get('name') as string,
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
  };

  // Validate
  const parsed = CreateTemplateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Create
  const result = await createTemplate(db, parsed.data);
  if (!result) {
    return { error: 'Failed to create template. Slug may already exist.' };
  }

  revalidatePath('/dashboard/templates');
  return { success: 'Template created' };
}

// ============================================
// Update Actions
// ============================================

/**
 * Update an existing template
 */
export async function updateTemplateAction(
  id: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    name: formData.get('name') as string,
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
  };

  // Validate
  const parsed = UpdateTemplateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Update
  const success = await updateTemplate(db, id, parsed.data);
  if (!success) {
    return { error: 'Failed to update template' };
  }

  revalidatePath('/dashboard/templates');
  revalidatePath('/dashboard/inquiries');
  return { success: 'Template updated' };
}

/**
 * Update template (non-form version for direct calls)
 */
export async function updateTemplateDirectAction(
  id: number,
  data: { name?: string; subject?: string; body?: string }
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const parsed = UpdateTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Validation failed' };
  }

  const success = await updateTemplate(db, id, parsed.data);
  if (!success) {
    return { error: 'Failed to update template' };
  }

  revalidatePath('/dashboard/templates');
  return { success: 'Template updated' };
}

// ============================================
// Delete Actions
// ============================================

/**
 * Delete a template (only non-default)
 */
export async function deleteTemplateAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const result = await deleteTemplate(db, id);
  if (!result.success) {
    return { error: result.error || 'Failed to delete template' };
  }

  revalidatePath('/dashboard/templates');
  return { success: 'Template deleted' };
}
