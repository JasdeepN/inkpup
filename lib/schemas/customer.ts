import { z } from 'zod/v4';

// =============================================================================
// Customer Schema
// =============================================================================

export const CustomerSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  total_deposits: z.number().default(0),
  inquiry_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

// =============================================================================
// Deposit Schema
// =============================================================================

export const DepositMethodSchema = z.enum(['e-transfer', 'cash', 'credit', 'other']);
export type DepositMethod = z.infer<typeof DepositMethodSchema>;

export const DepositStatusSchema = z.enum(['pending', 'received', 'refunded']);
export type DepositStatus = z.infer<typeof DepositStatusSchema>;

export const DepositSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  inquiry_id: z.number().nullable(),
  amount: z.number().positive(),
  method: DepositMethodSchema,
  status: DepositStatusSchema,
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  received_at: z.string().nullable(),
  created_at: z.string(),
});

export type Deposit = z.infer<typeof DepositSchema>;

export const CreateDepositSchema = z.object({
  customer_id: z.number(),
  inquiry_id: z.number().nullable().optional(),
  amount: z.number().positive(),
  method: DepositMethodSchema.default('e-transfer'),
  status: DepositStatusSchema.default('pending'),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateDeposit = z.infer<typeof CreateDepositSchema>;

export const UpdateDepositSchema = z.object({
  amount: z.number().positive().optional(),
  method: DepositMethodSchema.optional(),
  status: DepositStatusSchema.optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  received_at: z.string().nullable().optional(),
});

export type UpdateDeposit = z.infer<typeof UpdateDepositSchema>;

// =============================================================================
// Customer with related data
// =============================================================================

import type { Inquiry } from './inquiry';

export const CustomerWithDepositsSchema = CustomerSchema.extend({
  deposits: z.array(DepositSchema).default([]),
});

export type CustomerWithDeposits = z.infer<typeof CustomerWithDepositsSchema>;

// Extended type that includes inquiries (runtime only, not Zod validated)
export type CustomerWithDepositsAndInquiries = CustomerWithDeposits & {
  inquiries: Inquiry[];
};

// =============================================================================
// Validation helpers
// =============================================================================

export function validateCustomer(data: unknown): Customer | null {
  const result = CustomerSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateDeposit(data: unknown): Deposit | null {
  const result = DepositSchema.safeParse(data);
  return result.success ? result.data : null;
}
