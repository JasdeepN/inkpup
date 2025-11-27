/**
 * D1 Database Functions for Email Templates
 * @module lib/db/email-templates
 */

import type { D1Database } from '../../types/cloudflare';
import type { EmailTemplate, CreateTemplate, UpdateTemplate } from '../schemas/inquiry';

/**
 * Get all email templates
 */
export async function getTemplates(db: D1Database): Promise<EmailTemplate[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM email_templates ORDER BY is_default DESC, name ASC')
      .all<EmailTemplate>();

    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching templates:', error);
    return [];
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(
  db: D1Database,
  id: number
): Promise<EmailTemplate | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM email_templates WHERE id = ?')
      .bind(id)
      .first<EmailTemplate>();

    return result;
  } catch (error) {
    console.error('[D1] Error fetching template:', error);
    return null;
  }
}

/**
 * Get a single template by slug
 */
export async function getTemplateBySlug(
  db: D1Database,
  slug: string
): Promise<EmailTemplate | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM email_templates WHERE slug = ?')
      .bind(slug)
      .first<EmailTemplate>();

    return result;
  } catch (error) {
    console.error('[D1] Error fetching template by slug:', error);
    return null;
  }
}

/**
 * Create a new email template
 */
export async function createTemplate(
  db: D1Database,
  data: CreateTemplate
): Promise<{ id: number } | null> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO email_templates (slug, name, subject, body, is_default, created_at)
         VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
         RETURNING id`
      )
      .bind(data.slug, data.name, data.subject, data.body)
      .first<{ id: number }>();

    return result;
  } catch (error) {
    console.error('[D1] Error creating template:', error);
    return null;
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  db: D1Database,
  id: number,
  data: UpdateTemplate
): Promise<boolean> {
  try {
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.subject !== undefined) {
      updates.push('subject = ?');
      params.push(data.subject);
    }
    if (data.body !== undefined) {
      updates.push('body = ?');
      params.push(data.body);
    }

    if (updates.length === 0) {
      return true; // Nothing to update
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db
      .prepare(`UPDATE email_templates SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    return result.success;
  } catch (error) {
    console.error('[D1] Error updating template:', error);
    return false;
  }
}

/**
 * Delete a template (only non-default templates)
 */
export async function deleteTemplate(
  db: D1Database,
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if it's a default template
    const template = await getTemplateById(db, id);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    if (template.is_default === 1) {
      return { success: false, error: 'Cannot delete default templates' };
    }

    const result = await db
      .prepare('DELETE FROM email_templates WHERE id = ? AND is_default = 0')
      .bind(id)
      .run();

    return { success: result.success };
  } catch (error) {
    console.error('[D1] Error deleting template:', error);
    return { success: false, error: 'Database error' };
  }
}
