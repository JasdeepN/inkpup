/**
 * Deposit Database Queries
 * D1 operations for deposit tracking
 */

import type { D1Database } from '../../types/cloudflare';
import { getD1Binding } from './d1';
import type { Deposit, CreateDeposit, UpdateDeposit } from '../schemas/customer';
import { updateCustomerTotals } from './customers';

// =============================================================================
// Deposit Queries
// =============================================================================

/**
 * Get all deposits, ordered by most recent first
 */
export async function getAllDeposits(db?: D1Database): Promise<Deposit[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM deposits ORDER BY created_at DESC')
      .all<Deposit>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching deposits:', error);
    return [];
  }
}

/**
 * Get deposit by ID
 */
export async function getDepositById(id: number, db?: D1Database): Promise<Deposit | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    const result = await database
      .prepare('SELECT * FROM deposits WHERE id = ?')
      .bind(id)
      .first<Deposit>();
    
    return result || null;
  } catch (error) {
    console.error('[D1] Error fetching deposit by ID:', error);
    return null;
  }
}

/**
 * Get all deposits for a customer
 */
export async function getDepositsByCustomer(customerId: number, db?: D1Database): Promise<Deposit[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM deposits WHERE customer_id = ? ORDER BY created_at DESC')
      .bind(customerId)
      .all<Deposit>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching deposits by customer:', error);
    return [];
  }
}

/**
 * Get all deposits for an inquiry
 */
export async function getDepositsByInquiry(inquiryId: number, db?: D1Database): Promise<Deposit[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM deposits WHERE inquiry_id = ? ORDER BY created_at DESC')
      .bind(inquiryId)
      .all<Deposit>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching deposits by inquiry:', error);
    return [];
  }
}

/**
 * Get deposits by status
 */
export async function getDepositsByStatus(status: Deposit['status'], db?: D1Database): Promise<Deposit[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM deposits WHERE status = ? ORDER BY created_at DESC')
      .bind(status)
      .all<Deposit>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching deposits by status:', error);
    return [];
  }
}

/**
 * Create a new deposit
 */
export async function createDeposit(data: CreateDeposit, db?: D1Database): Promise<Deposit | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    const now = new Date().toISOString();
    const receivedAt = data.status === 'received' ? now : null;

    const result = await database
      .prepare(`
        INSERT INTO deposits (customer_id, inquiry_id, amount, method, status, reference, notes, received_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.customer_id,
        data.inquiry_id || null,
        data.amount,
        data.method || 'e-transfer',
        data.status || 'pending',
        data.reference || null,
        data.notes || null,
        receivedAt,
        now
      )
      .run();

    if (!result.success) {
      console.error('[D1] Failed to create deposit');
      return null;
    }

    // Update customer totals
    await updateCustomerTotals(data.customer_id, database);

    // Fetch the created deposit
    const depositId = result.meta.last_row_id;
    return getDepositById(depositId as number, database);
  } catch (error) {
    console.error('[D1] Error creating deposit:', error);
    return null;
  }
}

/**
 * Update an existing deposit
 */
export async function updateDeposit(id: number, data: UpdateDeposit, db?: D1Database): Promise<Deposit | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    // Get current deposit to know customer_id for totals update
    const current = await getDepositById(id, database);
    if (!current) {
      return null;
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }
    if (data.method !== undefined) {
      updates.push('method = ?');
      values.push(data.method);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
      // Auto-set received_at when status changes to 'received'
      if (data.status === 'received' && !current.received_at) {
        updates.push('received_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (data.reference !== undefined) {
      updates.push('reference = ?');
      values.push(data.reference);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.received_at !== undefined) {
      updates.push('received_at = ?');
      values.push(data.received_at);
    }

    if (updates.length === 0) {
      // Nothing to update
      return current;
    }

    values.push(id); // for WHERE clause

    const sql = `UPDATE deposits SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = database.prepare(sql);
    
    const result = await stmt.bind(...values).run();

    if (!result.success) {
      console.error('[D1] Failed to update deposit');
      return null;
    }

    // Update customer totals
    await updateCustomerTotals(current.customer_id, database);

    return getDepositById(id, database);
  } catch (error) {
    console.error('[D1] Error updating deposit:', error);
    return null;
  }
}

/**
 * Delete a deposit
 */
export async function deleteDeposit(id: number, db?: D1Database): Promise<boolean> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return false;
  }

  try {
    // Get current deposit to know customer_id for totals update
    const current = await getDepositById(id, database);
    if (!current) {
      return false;
    }

    const result = await database
      .prepare('DELETE FROM deposits WHERE id = ?')
      .bind(id)
      .run();

    if (result.success && (result.meta.changes || 0) > 0) {
      // Update customer totals
      await updateCustomerTotals(current.customer_id, database);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[D1] Error deleting deposit:', error);
    return false;
  }
}

/**
 * Mark a deposit as received
 */
export async function markDepositReceived(id: number, db?: D1Database): Promise<Deposit | null> {
  return updateDeposit(id, {
    status: 'received',
    received_at: new Date().toISOString(),
  }, db);
}

/**
 * Mark a deposit as refunded
 */
export async function markDepositRefunded(id: number, db?: D1Database): Promise<Deposit | null> {
  return updateDeposit(id, {
    status: 'refunded',
  }, db);
}

/**
 * Get total deposits (received) for a date range
 */
export async function getTotalDeposits(
  startDate?: string,
  endDate?: string,
  db?: D1Database
): Promise<{ total: number; count: number }> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return { total: 0, count: 0 };
  }

  try {
    let sql = `
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM deposits
      WHERE status = 'received'
    `;
    const params: string[] = [];

    if (startDate) {
      sql += ' AND received_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND received_at <= ?';
      params.push(endDate);
    }

    const stmt = database.prepare(sql);
    const result = params.length > 0 
      ? await stmt.bind(...params).first<{ total: number; count: number }>()
      : await stmt.first<{ total: number; count: number }>();

    return result || { total: 0, count: 0 };
  } catch (error) {
    console.error('[D1] Error getting total deposits:', error);
    return { total: 0, count: 0 };
  }
}
