'use server';

import { revalidatePath } from 'next/cache';
import { getD1Binding } from './db/d1';
import {
  getAllDeposits,
  getDepositById,
  getDepositsByCustomer,
  getDepositsByInquiry,
  getDepositsByStatus,
  createDeposit,
  updateDeposit,
  deleteDeposit,
  markDepositReceived,
  markDepositRefunded,
  getTotalDeposits,
} from './db/deposits';
import {
  CreateDepositSchema,
  UpdateDepositSchema,
  DepositStatusSchema,
  type Deposit,
  type DepositStatus,
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
 * Get all deposits
 */
export async function getDepositsAction(): Promise<{ deposits: Deposit[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposits: [], error: 'Database not available' };
  }

  const deposits = await getAllDeposits(db);
  return { deposits };
}

/**
 * Get a single deposit by ID
 */
export async function getDepositAction(id: number): Promise<{ deposit: Deposit | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposit: null, error: 'Database not available' };
  }

  const deposit = await getDepositById(id, db);
  return { deposit };
}

/**
 * Get all deposits for a customer
 */
export async function getDepositsByCustomerAction(
  customerId: number
): Promise<{ deposits: Deposit[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposits: [], error: 'Database not available' };
  }

  const deposits = await getDepositsByCustomer(customerId, db);
  return { deposits };
}

/**
 * Get all deposits for an inquiry
 */
export async function getDepositsByInquiryAction(
  inquiryId: number
): Promise<{ deposits: Deposit[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposits: [], error: 'Database not available' };
  }

  const deposits = await getDepositsByInquiry(inquiryId, db);
  return { deposits };
}

/**
 * Get deposits by status
 */
export async function getDepositsByStatusAction(
  status: DepositStatus
): Promise<{ deposits: Deposit[]; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposits: [], error: 'Database not available' };
  }

  const parsed = DepositStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { deposits: [], error: 'Invalid status' };
  }

  const deposits = await getDepositsByStatus(parsed.data, db);
  return { deposits };
}

/**
 * Get total deposits summary
 */
export async function getTotalDepositsAction(
  startDate?: string,
  endDate?: string
): Promise<{ total: number; count: number; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { total: 0, count: 0, error: 'Database not available' };
  }

  const result = await getTotalDeposits(startDate, endDate, db);
  return result;
}

// ============================================
// Write Actions
// ============================================

/**
 * Create a new deposit
 */
export async function createDepositAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    customer_id: parseInt(formData.get('customer_id')?.toString() || '0', 10),
    inquiry_id: formData.get('inquiry_id') 
      ? parseInt(formData.get('inquiry_id')?.toString() || '0', 10) 
      : null,
    amount: parseFloat(formData.get('amount')?.toString() || '0'),
    method: formData.get('method')?.toString() || 'e-transfer',
    status: formData.get('status')?.toString() || 'pending',
    reference: formData.get('reference')?.toString() || null,
    notes: formData.get('notes')?.toString() || null,
  };

  const parsed = CreateDepositSchema.safeParse(rawData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const deposit = await createDeposit(parsed.data, db);
  if (!deposit) {
    return { error: 'Failed to create deposit' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${parsed.data.customer_id}`);
  if (parsed.data.inquiry_id) {
    revalidatePath(`/dashboard/inquiries/${parsed.data.inquiry_id}`);
  }
  return { success: 'Deposit recorded successfully' };
}

/**
 * Update an existing deposit
 */
export async function updateDepositAction(
  id: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData: Record<string, unknown> = {};
  
  const amount = formData.get('amount')?.toString();
  if (amount) rawData.amount = parseFloat(amount);
  
  const method = formData.get('method')?.toString();
  if (method) rawData.method = method;
  
  const status = formData.get('status')?.toString();
  if (status) rawData.status = status;
  
  const reference = formData.get('reference')?.toString();
  if (reference !== undefined) rawData.reference = reference || null;
  
  const notes = formData.get('notes')?.toString();
  if (notes !== undefined) rawData.notes = notes || null;

  const parsed = UpdateDepositSchema.safeParse(rawData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const deposit = await updateDeposit(id, parsed.data, db);
  if (!deposit) {
    return { error: 'Failed to update deposit' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${deposit.customer_id}`);
  return { success: 'Deposit updated successfully' };
}

/**
 * Mark a deposit as received
 */
export async function markDepositReceivedAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const deposit = await markDepositReceived(id, db);
  if (!deposit) {
    return { error: 'Failed to mark deposit as received' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${deposit.customer_id}`);
  return { success: 'Deposit marked as received' };
}

/**
 * Mark a deposit as refunded
 */
export async function markDepositRefundedAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const deposit = await markDepositRefunded(id, db);
  if (!deposit) {
    return { error: 'Failed to mark deposit as refunded' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${deposit.customer_id}`);
  return { success: 'Deposit marked as refunded' };
}

/**
 * Delete a deposit
 */
export async function deleteDepositAction(id: number): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  // Get deposit first to know customer_id for revalidation
  const deposit = await getDepositById(id, db);
  if (!deposit) {
    return { error: 'Deposit not found' };
  }

  const success = await deleteDeposit(id, db);
  if (!success) {
    return { error: 'Failed to delete deposit' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${deposit.customer_id}`);
  return { success: 'Deposit deleted' };
}

/**
 * Quick create deposit (without form, for simpler UI)
 */
export async function quickCreateDepositAction(
  customerId: number,
  amount: number,
  method: string = 'e-transfer',
  inquiryId?: number
): Promise<{ deposit: Deposit | null; error?: string }> {
  const db = getD1Binding();
  if (!db) {
    return { deposit: null, error: 'Database not available' };
  }

  const deposit = await createDeposit({
    customer_id: customerId,
    inquiry_id: inquiryId || null,
    amount,
    method: method as 'e-transfer' | 'cash' | 'credit' | 'other',
    status: 'pending',
  }, db);

  if (!deposit) {
    return { deposit: null, error: 'Failed to create deposit' };
  }

  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { deposit };
}
