/**
 * Customer Database Queries
 * D1 operations for customer CRM functionality
 */

import type { D1Database } from '../../types/cloudflare';
import { getD1Binding } from './d1';
import type { Customer, CreateCustomer, UpdateCustomer, CustomerWithDeposits, CustomerWithDepositsAndInquiries, Deposit } from '../schemas/customer';
import type { Inquiry } from '../schemas/inquiry';

// =============================================================================
// Customer Queries
// =============================================================================

/**
 * Get all customers, ordered by most recent first
 */
export async function getAllCustomers(db?: D1Database): Promise<Customer[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const result = await database
      .prepare('SELECT * FROM customers ORDER BY created_at DESC')
      .all<Customer>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching customers:', error);
    return [];
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: number, db?: D1Database): Promise<Customer | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    const result = await database
      .prepare('SELECT * FROM customers WHERE id = ?')
      .bind(id)
      .first<Customer>();
    
    return result || null;
  } catch (error) {
    console.error('[D1] Error fetching customer by ID:', error);
    return null;
  }
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string, db?: D1Database): Promise<Customer | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    const result = await database
      .prepare('SELECT * FROM customers WHERE email = ?')
      .bind(email.toLowerCase())
      .first<Customer>();
    
    return result || null;
  } catch (error) {
    console.error('[D1] Error fetching customer by email:', error);
    return null;
  }
}

/**
 * Get customer with all their deposits
 */
export async function getCustomerWithDeposits(id: number, db?: D1Database): Promise<CustomerWithDeposits | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    // Get customer
    const customer = await database
      .prepare('SELECT * FROM customers WHERE id = ?')
      .bind(id)
      .first<Customer>();
    
    if (!customer) return null;

    // Get deposits
    const depositsResult = await database
      .prepare('SELECT * FROM deposits WHERE customer_id = ? ORDER BY created_at DESC')
      .bind(id)
      .all<Deposit>();

    return {
      ...customer,
      deposits: depositsResult.results || [],
    };
  } catch (error) {
    console.error('[D1] Error fetching customer with deposits:', error);
    return null;
  }
}

/**
 * Get customer with all their deposits AND linked inquiries
 */
export async function getCustomerWithDepositsAndInquiries(id: number, db?: D1Database): Promise<CustomerWithDepositsAndInquiries | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    // Get customer
    const customer = await database
      .prepare('SELECT * FROM customers WHERE id = ?')
      .bind(id)
      .first<Customer>();
    
    if (!customer) return null;

    // Get deposits
    const depositsResult = await database
      .prepare('SELECT * FROM deposits WHERE customer_id = ? ORDER BY created_at DESC')
      .bind(id)
      .all<Deposit>();

    // Get inquiries linked to this customer
    const inquiriesResult = await database
      .prepare('SELECT * FROM inquiries WHERE customer_id = ? ORDER BY created_at DESC')
      .bind(id)
      .all<Inquiry>();

    return {
      ...customer,
      deposits: depositsResult.results || [],
      inquiries: inquiriesResult.results || [],
    };
  } catch (error) {
    console.error('[D1] Error fetching customer with deposits and inquiries:', error);
    return null;
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomer, db?: D1Database): Promise<Customer | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    const now = new Date().toISOString();
    const result = await database
      .prepare(`
        INSERT INTO customers (email, name, phone, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        data.email.toLowerCase(),
        data.name,
        data.phone || null,
        data.notes || null,
        now,
        now
      )
      .run();

    if (!result.success) {
      console.error('[D1] Failed to create customer');
      return null;
    }

    // Fetch the created customer
    const customerId = result.meta.last_row_id;
    return getCustomerById(customerId as number, database);
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      console.error('[D1] Customer with this email already exists');
      return null;
    }
    console.error('[D1] Error creating customer:', error);
    return null;
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(id: number, data: UpdateCustomer, db?: D1Database): Promise<Customer | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  try {
    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }

    if (updates.length === 0) {
      // Nothing to update
      return getCustomerById(id, database);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id.toString()); // for WHERE clause

    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = database.prepare(sql);
    
    // Bind all values
    const result = await stmt.bind(...values).run();

    if (!result.success) {
      console.error('[D1] Failed to update customer');
      return null;
    }

    return getCustomerById(id, database);
  } catch (error) {
    console.error('[D1] Error updating customer:', error);
    return null;
  }
}

/**
 * Delete a customer (and cascade to deposits)
 */
export async function deleteCustomer(id: number, db?: D1Database): Promise<boolean> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return false;
  }

  try {
    const result = await database
      .prepare('DELETE FROM customers WHERE id = ?')
      .bind(id)
      .run();

    return result.success && (result.meta.changes || 0) > 0;
  } catch (error) {
    console.error('[D1] Error deleting customer:', error);
    return false;
  }
}

/**
 * Get or create a customer by email
 * Used when linking inquiries - creates customer if doesn't exist
 */
export async function getOrCreateCustomer(
  email: string,
  name: string,
  phone?: string | null,
  notes?: string | null,
  db?: D1Database
): Promise<Customer | null> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return null;
  }

  // Try to find existing customer
  const existing = await getCustomerByEmail(email, database);
  if (existing) {
    // If existing customer has no notes but we have notes, update them
    if (!existing.notes && notes) {
      await updateCustomer(existing.id, { notes }, database);
      return { ...existing, notes };
    }
    return existing;
  }

  // Create new customer with notes
  return createCustomer({
    email,
    name,
    phone,
    notes,
  }, database);
}

/**
 * Update customer's cached totals (call after deposit changes)
 */
export async function updateCustomerTotals(customerId: number, db?: D1Database): Promise<void> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return;
  }

  try {
    // Calculate total deposits (only 'received' status)
    const depositSum = await database
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM deposits
        WHERE customer_id = ? AND status = 'received'
      `)
      .bind(customerId)
      .first<{ total: number }>();

    // Count linked inquiries
    const inquiryCount = await database
      .prepare(`
        SELECT COUNT(*) as count
        FROM inquiries
        WHERE customer_id = ?
      `)
      .bind(customerId)
      .first<{ count: number }>();

    // Update customer
    await database
      .prepare(`
        UPDATE customers
        SET total_deposits = ?, inquiry_count = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        depositSum?.total || 0,
        inquiryCount?.count || 0,
        new Date().toISOString(),
        customerId
      )
      .run();
  } catch (error) {
    console.error('[D1] Error updating customer totals:', error);
  }
}

/**
 * Search customers by name or email
 */
export async function searchCustomers(query: string, db?: D1Database): Promise<Customer[]> {
  const database = db || getD1Binding();
  if (!database) {
    console.error('[D1] No database binding available');
    return [];
  }

  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    const result = await database
      .prepare(`
        SELECT * FROM customers
        WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .bind(searchTerm, searchTerm)
      .all<Customer>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error searching customers:', error);
    return [];
  }
}
