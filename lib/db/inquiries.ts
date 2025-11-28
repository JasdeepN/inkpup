/**
 * D1 Database Functions for Inquiries
 * @module lib/db/inquiries
 */

import type { D1Database } from '../../types/cloudflare';
import { getD1Binding } from './d1';
import type { Inquiry, CreateInquiry, InquiryStatus } from '../schemas/inquiry';

/**
 * Create a new inquiry in D1
 */
export async function createInquiry(
  db: D1Database,
  data: CreateInquiry
): Promise<{ id: number } | null> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO inquiries (name, email, phone, inquiry_type, design_id, message, placement, budget, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unread', CURRENT_TIMESTAMP)
         RETURNING id`
      )
      .bind(
        data.name,
        data.email,
        data.phone ?? null,
        data.inquiry_type ?? 'contact',
        data.design_id ?? null,
        data.message ?? null,
        data.placement ?? null,
        data.budget ?? null
      )
      .first<{ id: number }>();

    return result;
  } catch (error) {
    console.error('[D1] Error creating inquiry:', error);
    return null;
  }
}

/**
 * Get all inquiries with optional status filter
 */
export async function getInquiries(
  db: D1Database,
  status?: InquiryStatus | 'all'
): Promise<Inquiry[]> {
  try {
    let query = 'SELECT * FROM inquiries';
    const params: string[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const result = params.length > 0
      ? await stmt.bind(...params).all<Inquiry>()
      : await stmt.all<Inquiry>();

    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching inquiries:', error);
    return [];
  }
}

/**
 * Get a single inquiry by ID
 */
export async function getInquiryById(
  db: D1Database,
  id: number
): Promise<Inquiry | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM inquiries WHERE id = ?')
      .bind(id)
      .first<Inquiry>();

    return result;
  } catch (error) {
    console.error('[D1] Error fetching inquiry:', error);
    return null;
  }
}

/**
 * Update inquiry status
 */
export async function updateInquiryStatus(
  db: D1Database,
  id: number,
  status: InquiryStatus
): Promise<boolean> {
  try {
    const updates: string[] = ['status = ?'];
    const params: (string | number)[] = [status];

    // If marking as replied, also set replied_at
    if (status === 'replied') {
      updates.push('replied_at = CURRENT_TIMESTAMP');
    }

    params.push(id);

    const result = await db
      .prepare(`UPDATE inquiries SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    return result.success;
  } catch (error) {
    console.error('[D1] Error updating inquiry status:', error);
    return false;
  }
}

/**
 * Update inquiry internal notes
 */
export async function updateInquiryNotes(
  db: D1Database,
  id: number,
  notes: string
): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE inquiries SET notes = ? WHERE id = ?')
      .bind(notes, id)
      .run();

    return result.success;
  } catch (error) {
    console.error('[D1] Error updating inquiry notes:', error);
    return false;
  }
}

/**
 * Get count of unread inquiries (for badge)
 */
export async function getUnreadCount(db: D1Database): Promise<number> {
  try {
    const result = await db
      .prepare('SELECT COUNT(*) as count FROM inquiries WHERE status = ?')
      .bind('unread')
      .first<{ count: number }>();

    return result?.count ?? 0;
  } catch (error) {
    console.error('[D1] Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Delete an inquiry (and cascade to inquiry_emails)
 */
export async function deleteInquiry(
  db: D1Database,
  id: number
): Promise<boolean> {
  try {
    const result = await db
      .prepare('DELETE FROM inquiries WHERE id = ?')
      .bind(id)
      .run();

    return result.success;
  } catch (error) {
    console.error('[D1] Error deleting inquiry:', error);
    return false;
  }
}

/**
 * Link an inquiry to a customer
 */
export async function linkInquiryToCustomer(
  db: D1Database,
  inquiryId: number,
  customerId: number
): Promise<boolean> {
  try {
    const result = await db
      .prepare('UPDATE inquiries SET customer_id = ?, status = ? WHERE id = ?')
      .bind(customerId, 'customer_created', inquiryId)
      .run();

    return result.success;
  } catch (error) {
    console.error('[D1] Error linking inquiry to customer:', error);
    return false;
  }
}

/**
 * Get all inquiries for a customer
 */
export async function getInquiriesByCustomerId(
  customerId: number,
  db?: D1Database
): Promise<Inquiry[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM inquiries WHERE customer_id = ? ORDER BY created_at DESC')
      .bind(customerId)
      .all<Inquiry>();

    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching inquiries by customer:', error);
    return [];
  }
}

/**
 * Helper: Get D1 and create inquiry (convenience wrapper)
 */
export async function createInquiryWithBinding(
  data: CreateInquiry
): Promise<{ id: number } | null> {
  const db = getD1Binding();
  if (!db) {
    console.warn('[D1] Database not available for inquiry creation');
    return null;
  }
  return createInquiry(db, data);
}
