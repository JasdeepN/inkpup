'use server';

/**
 * Server actions for pricing admin CRUD operations
 * Uses Zod validation schemas and D1 database functions
 */

import { revalidatePath } from 'next/cache';
import {
  CreateStyleSchema,
  UpdateStyleSchema,
  DeleteStyleSchema,
  CreateSizeSchema,
  UpdateSizeSchema,
  DeleteSizeSchema,
  CreateColorSchema,
  UpdateColorSchema,
  DeleteColorSchema,
} from './schemas/pricing';
import {
  getD1Binding,
  createStyle,
  updateStyle,
  deleteStyle,
  createSizeCategory,
  updateSizeCategory,
  deleteSizeCategory,
  createColorProfile,
  updateColorProfile,
  deleteColorProfile,
  getSetting,
  setSetting,
} from './db/d1';

// ============================================================================
// COMMON TYPES
// ============================================================================

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

// ============================================================================
// STYLE ACTIONS
// ============================================================================

/**
 * Create a new style
 */
export async function createStyleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString() ?? '',
    multiplier: parseFloat(formData.get('multiplier')?.toString() ?? '1'),
    description: formData.get('description')?.toString() || null,
    recommended_color_type: formData.get('recommended_color_type')?.toString() || null,
    sort_order: parseInt(formData.get('sort_order')?.toString() ?? '0', 10),
  };

  const result = CreateStyleSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  try {
    await createStyle(db, result.data);
    revalidatePath('/dashboard/pricing/styles');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[createStyleAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create style' };
  }
}

/**
 * Update an existing style
 */
export async function updateStyleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString(),
    multiplier: formData.has('multiplier')
      ? parseFloat(formData.get('multiplier')?.toString() ?? '1')
      : undefined,
    description: formData.has('description')
      ? formData.get('description')?.toString() || null
      : undefined,
    recommended_color_type: formData.has('recommended_color_type')
      ? formData.get('recommended_color_type')?.toString() || null
      : undefined,
    sort_order: formData.has('sort_order')
      ? parseInt(formData.get('sort_order')?.toString() ?? '0', 10)
      : undefined,
  };

  const result = UpdateStyleSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  const { id, ...updateData } = result.data;
  try {
    await updateStyle(db, id, updateData);
    revalidatePath('/dashboard/pricing/styles');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[updateStyleAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update style' };
  }
}

/**
 * Delete a style
 */
export async function deleteStyleAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = { id: formData.get('id')?.toString() ?? '' };
  const result = DeleteStyleSchema.safeParse(rawData);
  if (!result.success) {
    return { error: 'Invalid style ID' };
  }

  try {
    await deleteStyle(db, result.data.id);
    revalidatePath('/dashboard/pricing/styles');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[deleteStyleAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete style' };
  }
}

// ============================================================================
// SIZE CATEGORY ACTIONS
// ============================================================================

/**
 * Create a new size category
 */
export async function createSizeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString() ?? '',
    min_price: parseFloat(formData.get('min_price')?.toString() ?? '0'),
    max_price: parseFloat(formData.get('max_price')?.toString() ?? '0'),
    description: formData.get('description')?.toString() || null,
    sort_order: parseInt(formData.get('sort_order')?.toString() ?? '0', 10),
  };

  const result = CreateSizeSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  try {
    await createSizeCategory(db, result.data);
    revalidatePath('/dashboard/pricing/sizes');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[createSizeAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create size category' };
  }
}

/**
 * Update an existing size category
 */
export async function updateSizeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString(),
    min_price: formData.has('min_price')
      ? parseFloat(formData.get('min_price')?.toString() ?? '0')
      : undefined,
    max_price: formData.has('max_price')
      ? parseFloat(formData.get('max_price')?.toString() ?? '0')
      : undefined,
    description: formData.has('description')
      ? formData.get('description')?.toString() || null
      : undefined,
    sort_order: formData.has('sort_order')
      ? parseInt(formData.get('sort_order')?.toString() ?? '0', 10)
      : undefined,
  };

  const result = UpdateSizeSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  const { id, ...updateData } = result.data;
  try {
    await updateSizeCategory(db, id, updateData);
    revalidatePath('/dashboard/pricing/sizes');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[updateSizeAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update size category' };
  }
}

/**
 * Delete a size category
 */
export async function deleteSizeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = { id: formData.get('id')?.toString() ?? '' };
  const result = DeleteSizeSchema.safeParse(rawData);
  if (!result.success) {
    return { error: 'Invalid size category ID' };
  }

  try {
    await deleteSizeCategory(db, result.data.id);
    revalidatePath('/dashboard/pricing/sizes');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[deleteSizeAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete size category' };
  }
}

// ============================================================================
// COLOR PROFILE ACTIONS
// ============================================================================

/**
 * Create a new color profile
 */
export async function createColorAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString() ?? '',
    multiplier: parseFloat(formData.get('multiplier')?.toString() ?? '1'),
    description: formData.get('description')?.toString() || null,
    sort_order: parseInt(formData.get('sort_order')?.toString() ?? '0', 10),
  };

  const result = CreateColorSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  try {
    await createColorProfile(db, result.data);
    revalidatePath('/dashboard/pricing/colors');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[createColorAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create color profile' };
  }
}

/**
 * Update an existing color profile
 */
export async function updateColorAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = {
    id: formData.get('id')?.toString() ?? '',
    label: formData.get('label')?.toString(),
    multiplier: formData.has('multiplier')
      ? parseFloat(formData.get('multiplier')?.toString() ?? '1')
      : undefined,
    description: formData.has('description')
      ? formData.get('description')?.toString() || null
      : undefined,
    sort_order: formData.has('sort_order')
      ? parseInt(formData.get('sort_order')?.toString() ?? '0', 10)
      : undefined,
  };

  const result = UpdateColorSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { error: 'Validation failed', fieldErrors };
  }

  const { id, ...updateData } = result.data;
  try {
    await updateColorProfile(db, id, updateData);
    revalidatePath('/dashboard/pricing/colors');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[updateColorAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update color profile' };
  }
}

/**
 * Delete a color profile
 */
export async function deleteColorAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const rawData = { id: formData.get('id')?.toString() ?? '' };
  const result = DeleteColorSchema.safeParse(rawData);
  if (!result.success) {
    return { error: 'Invalid color profile ID' };
  }

  try {
    await deleteColorProfile(db, result.data.id);
    revalidatePath('/dashboard/pricing/colors');
    revalidatePath('/pricing');
    return { success: true };
  } catch (error) {
    console.error('[deleteColorAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete color profile' };
  }
}

// ============================================================================
// HERO SETTINGS ACTIONS
// ============================================================================

/**
 * Get the active hero image ID from site settings
 */
export async function getActiveHeroId(): Promise<string | null> {
  const db = getD1Binding();
  if (!db) {
    return null;
  }
  return getSetting(db, 'active_hero_id');
}

/**
 * Set the active hero image ID
 */
export async function setActiveHeroAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const db = getD1Binding();
  if (!db) {
    return { error: 'Database not available' };
  }

  const heroId = formData.get('hero_id')?.toString();
  if (!heroId) {
    return { error: 'Hero ID is required' };
  }

  try {
    await setSetting(db, 'active_hero_id', heroId);
    revalidatePath('/');
    revalidatePath('/dashboard/hero');
    return { success: true };
  } catch (error) {
    console.error('[setActiveHeroAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to set active hero' };
  }
}
