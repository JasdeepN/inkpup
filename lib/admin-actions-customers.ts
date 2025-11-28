'use server';

import { revalidatePath } from 'next/cache';
import { getD1Binding } from './db/d1';
import {
  getAllCustomers,
  getCustomerById,
  getCustomerByEmail,
  getCustomerWithDeposits,
  getCustomerWithDepositsAndInquiries,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getOrCreateCustomer,
  searchCustomers,
} from './db/customers';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  type Customer,
  type CustomerWithDeposits,
  type CustomerWithDepositsAndInquiries,
} from './schemas/customer';

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
 * Get all customers
 */
export async function getCustomersAction(): Promise<{ customers: Customer[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { customers: [], error: 'Database not available' };
  }

  const customers = await getAllCustomers(db);
  return { customers };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerAction(id: number): Promise<{ customer: Customer | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { customer: null, error: 'Database not available' };
  }

  const customer = await getCustomerById(id, db);
  return { customer };
}

/**
 * Get a customer with all their deposits and inquiries
 */
export async function getCustomerWithDepositsAction(
  id: number
): Promise<{ customer: CustomerWithDepositsAndInquiries | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { customer: null, error: 'Database not available' };
  }

  const customer = await getCustomerWithDepositsAndInquiries(id, db);
  return { customer };
}

/**
 * Search customers by name or email
 */
export async function searchCustomersAction(
  query: string
): Promise<{ customers: Customer[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { customers: [], error: 'Database not available' };
  }

  if (!query || query.trim().length < 2) {
    return { customers: [] };
  }

  const customers = await searchCustomers(query.trim(), db);
  return { customers };
}

// ============================================
// Write Actions
// ============================================

/**
 * Create a new customer
 */
export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    email: formData.get('email')?.toString() || '',
    name: formData.get('name')?.toString() || '',
    phone: formData.get('phone')?.toString() || null,
    notes: formData.get('notes')?.toString() || null,
  };

  const parsed = CreateCustomerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Check if customer already exists
  const existing = await getCustomerByEmail(parsed.data.email, db);
  if (existing) {
    return { error: 'A customer with this email already exists' };
  }

  const customer = await createCustomer(parsed.data, db);
  if (!customer) {
    return { error: 'Failed to create customer' };
  }

  revalidatePath('/dashboard/customers');
  return { success: 'Customer created successfully' };
}

/**
 * Update an existing customer
 */
export async function updateCustomerAction(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData: Record<string, unknown> = {};
  
  const name = formData.get('name')?.toString();
  if (name !== undefined) rawData.name = name;
  
  const phone = formData.get('phone')?.toString();
  if (phone !== undefined) rawData.phone = phone || null;
  
  const notes = formData.get('notes')?.toString();
  if (notes !== undefined) rawData.notes = notes || null;

  const parsed = UpdateCustomerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const customer = await updateCustomer(id, parsed.data, db);
  if (!customer) {
    return { error: 'Failed to update customer' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${id}`);
  return { success: 'Customer updated successfully' };
}

/**
 * Update customer notes (simple action without form)
 */
export async function updateCustomerNotesAction(
  id: number,
  notes: string
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const customer = await updateCustomer(id, { notes }, db);
  if (!customer) {
    return { error: 'Failed to update notes' };
  }

  revalidatePath(`/dashboard/customers/${id}`);
  return { success: 'Notes saved' };
}

/**
 * Delete a customer
 */
export async function deleteCustomerAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const success = await deleteCustomer(id, db);
  if (!success) {
    return { error: 'Failed to delete customer' };
  }

  revalidatePath('/dashboard/customers');
  return { success: 'Customer deleted' };
}

/**
 * Get or create a customer (used when linking inquiries)
 */
export async function getOrCreateCustomerAction(
  email: string,
  name: string,
  phone?: string | null
): Promise<{ customer: Customer | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { customer: null, error: 'Database not available' };
  }

  const customer = await getOrCreateCustomer(email, name, phone, null, db);
  if (!customer) {
    return { customer: null, error: 'Failed to get or create customer' };
  }

  revalidatePath('/dashboard/customers');
  return { customer };
}
