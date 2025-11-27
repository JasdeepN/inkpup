/**
 * D1 Database Functions for Inquiry Emails (sent message log)
 * @module lib/db/inquiry-emails
 */

import type { D1Database } from '../../types/cloudflare';
import type { InquiryEmail, CreateInquiryEmail } from '../schemas/inquiry';

/**
 * Create a record of a sent email
 */
export async function createInquiryEmail(
  db: D1Database,
  data: CreateInquiryEmail
): Promise<{ id: number } | null> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO inquiry_emails (inquiry_id, template_id, subject, body, sent_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         RETURNING id`
      )
      .bind(
        data.inquiry_id,
        data.template_id ?? null,
        data.subject,
        data.body
      )
      .first<{ id: number }>();

    return result;
  } catch (error) {
    console.error('[D1] Error creating inquiry email record:', error);
    return null;
  }
}

/**
 * Get all emails sent for a specific inquiry (conversation history)
 */
export async function getEmailsByInquiryId(
  db: D1Database,
  inquiryId: number
): Promise<InquiryEmail[]> {
  try {
    const result = await db
      .prepare(
        `SELECT ie.*, et.name as template_name
         FROM inquiry_emails ie
         LEFT JOIN email_templates et ON ie.template_id = et.id
         WHERE ie.inquiry_id = ?
         ORDER BY ie.sent_at ASC`
      )
      .bind(inquiryId)
      .all<InquiryEmail & { template_name?: string }>();

    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching inquiry emails:', error);
    return [];
  }
}

/**
 * Get the most recent email sent for an inquiry
 */
export async function getLatestEmailForInquiry(
  db: D1Database,
  inquiryId: number
): Promise<InquiryEmail | null> {
  try {
    const result = await db
      .prepare(
        `SELECT * FROM inquiry_emails
         WHERE inquiry_id = ?
         ORDER BY sent_at DESC
         LIMIT 1`
      )
      .bind(inquiryId)
      .first<InquiryEmail>();

    return result;
  } catch (error) {
    console.error('[D1] Error fetching latest inquiry email:', error);
    return null;
  }
}

/**
 * Count total emails sent for an inquiry
 */
export async function getEmailCountForInquiry(
  db: D1Database,
  inquiryId: number
): Promise<number> {
  try {
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM inquiry_emails WHERE inquiry_id = ?')
      .bind(inquiryId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  } catch (error) {
    console.error('[D1] Error counting inquiry emails:', error);
    return 0;
  }
}
