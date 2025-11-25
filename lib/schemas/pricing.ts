/**
 * Zod validation schemas for pricing admin forms
 * Used by server actions to validate input before D1 operations
 */
import { z } from 'zod';

// ============================================================================
// STYLE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new style
 */
export const CreateStyleSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(50, 'ID must be 50 characters or less')
    .regex(/^[a-z0-9_-]+$/, 'ID must be lowercase alphanumeric with dashes or underscores'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less'),
  multiplier: z
    .number()
    .min(0.1, 'Multiplier must be at least 0.1')
    .max(10, 'Multiplier must be 10 or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
  recommended_color_type: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().min(0).optional().default(0),
});

/**
 * Schema for updating an existing style
 */
export const UpdateStyleSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  label: z.string().min(1).max(100).optional(),
  multiplier: z.number().min(0.1).max(10).optional(),
  description: z.string().max(500).nullable().optional(),
  recommended_color_type: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

/**
 * Schema for deleting a style
 */
export const DeleteStyleSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ============================================================================
// SIZE CATEGORY SCHEMAS
// ============================================================================

/**
 * Schema for creating a new size category
 */
export const CreateSizeSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(50, 'ID must be 50 characters or less')
    .regex(/^[a-z0-9_-]+$/, 'ID must be lowercase alphanumeric with dashes or underscores'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less'),
  min_price: z
    .number()
    .min(0, 'Minimum price must be 0 or greater')
    .max(100000, 'Minimum price must be 100000 or less'),
  max_price: z
    .number()
    .min(0, 'Maximum price must be 0 or greater')
    .max(100000, 'Maximum price must be 100000 or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
  sort_order: z.number().int().min(0).optional().default(0),
}).refine((data) => data.max_price >= data.min_price, {
  message: 'Maximum price must be greater than or equal to minimum price',
  path: ['max_price'],
});

/**
 * Schema for updating an existing size category
 */
export const UpdateSizeSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  label: z.string().min(1).max(100).optional(),
  min_price: z.number().min(0).max(100000).optional(),
  max_price: z.number().min(0).max(100000).optional(),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

/**
 * Schema for deleting a size category
 */
export const DeleteSizeSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ============================================================================
// COLOR PROFILE SCHEMAS
// ============================================================================

/**
 * Schema for creating a new color profile
 */
export const CreateColorSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(50, 'ID must be 50 characters or less')
    .regex(/^[a-z0-9_-]+$/, 'ID must be lowercase alphanumeric with dashes or underscores'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less'),
  multiplier: z
    .number()
    .min(0.1, 'Multiplier must be at least 0.1')
    .max(10, 'Multiplier must be 10 or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
  sort_order: z.number().int().min(0).optional().default(0),
});

/**
 * Schema for updating an existing color profile
 */
export const UpdateColorSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  label: z.string().min(1).max(100).optional(),
  multiplier: z.number().min(0.1).max(10).optional(),
  description: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
});

/**
 * Schema for deleting a color profile
 */
export const DeleteColorSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateStyleInput = z.infer<typeof CreateStyleSchema>;
export type UpdateStyleInput = z.infer<typeof UpdateStyleSchema>;
export type DeleteStyleInput = z.infer<typeof DeleteStyleSchema>;

export type CreateSizeInput = z.infer<typeof CreateSizeSchema>;
export type UpdateSizeInput = z.infer<typeof UpdateSizeSchema>;
export type DeleteSizeInput = z.infer<typeof DeleteSizeSchema>;

export type CreateColorInput = z.infer<typeof CreateColorSchema>;
export type UpdateColorInput = z.infer<typeof UpdateColorSchema>;
export type DeleteColorInput = z.infer<typeof DeleteColorSchema>;
