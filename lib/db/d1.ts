/**
 * D1 Database Client Wrapper
 * Provides type-safe queries for pricing data
 */

import type { D1Database, SizeCategory, Style, ColorProfile } from '../../types/cloudflare';
import type { GalleryItem } from '../gallery-types';

/**
 * Check if a value looks like a D1 binding
 */
function looksLikeD1Binding(candidate: unknown): candidate is D1Database {
  if (!candidate) return false;
  if (typeof candidate !== 'object') return false;
  const binding = candidate as Record<string, unknown>;
  return typeof binding.prepare === 'function';
}

/**
 * Get D1 database binding from Cloudflare Workers environment
 * Uses the same pattern as R2 binding resolution via @opennextjs/cloudflare
 */
export function getD1Binding(): D1Database | undefined {
  try {
    // Check globalThis.DB (set by Cloudflare Workers runtime)
    const globalDB = (globalThis as Record<string, unknown>).DB;
    if (looksLikeD1Binding(globalDB)) {
      return globalDB;
    }

    // Check Cloudflare context symbol (set by initOpenNextCloudflareForDev)
    const symbolKey = Symbol.for('__cloudflare-context__');
    const symbolContext = (globalThis as Record<symbol, unknown>)[symbolKey] as { env?: Record<string, unknown> } | undefined;
    if (symbolContext?.env && looksLikeD1Binding(symbolContext.env.DB)) {
      return symbolContext.env.DB as D1Database;
    }

    // Try getCloudflareContext() from @opennextjs/cloudflare
    try {
      const mod = require('@opennextjs/cloudflare');
      if (mod && typeof mod.getCloudflareContext === 'function') {
        const ctx = mod.getCloudflareContext();
        if (ctx?.env && looksLikeD1Binding(ctx.env.DB)) {
          return ctx.env.DB as D1Database;
        }
      }
    } catch {
      // Module not available, continue to fallback
    }

    // Fallback: check process.env.DB (edge runtime)
    if (typeof process !== 'undefined' && looksLikeD1Binding(process.env?.DB)) {
      return process.env.DB as unknown as D1Database;
    }
  } catch {
    // Ignore runtime errors
  }

  return undefined;
}

/**
 * Query all size categories from D1, ordered by sort_order
 */
export async function getSizeCategories(db: D1Database): Promise<SizeCategory[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM size_categories ORDER BY sort_order ASC')
      .all<SizeCategory>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching size categories:', error);
    throw new Error('Failed to fetch size categories from database');
  }
}

/**
 * Query all styles from D1, ordered by sort_order
 */
export async function getStyles(db: D1Database): Promise<Style[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM styles ORDER BY sort_order ASC')
      .all<Style>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching styles:', error);
    throw new Error('Failed to fetch styles from database');
  }
}

/**
 * Query all color profiles from D1, ordered by sort_order
 */
export async function getColorProfiles(db: D1Database): Promise<ColorProfile[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM color_profiles ORDER BY sort_order ASC')
      .all<ColorProfile>();
    
    return result.results || [];
  } catch (error) {
    console.error('[D1] Error fetching color profiles:', error);
    throw new Error('Failed to fetch color profiles from database');
  }
}

/**
 * Query a single size category by ID
 */
export async function getSizeCategoryById(db: D1Database, id: string): Promise<SizeCategory | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM size_categories WHERE id = ?')
      .bind(id)
      .first<SizeCategory>();
    
    return result || null;
  } catch (error) {
    console.error(`[D1] Error fetching size category ${id}:`, error);
    return null;
  }
}

/**
 * Query a single style by ID
 */
export async function getStyleById(db: D1Database, id: string): Promise<Style | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM styles WHERE id = ?')
      .bind(id)
      .first<Style>();
    
    return result || null;
  } catch (error) {
    console.error(`[D1] Error fetching style ${id}:`, error);
    return null;
  }
}

/**
 * Query a single color profile by ID
 */
export async function getColorProfileById(db: D1Database, id: string): Promise<ColorProfile | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM color_profiles WHERE id = ?')
      .bind(id)
      .first<ColorProfile>();
    
    return result || null;
  } catch (error) {
    console.error(`[D1] Error fetching color profile ${id}:`, error);
    return null;
  }
}

/**
 * Insert or update a gallery image
 */
export async function insertGalleryImage(db: D1Database, item: GalleryItem): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO gallery_images (id, key, url, category, alt, caption, width, height, size_bytes, uploaded_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           url = excluded.url,
           category = excluded.category,
           alt = excluded.alt,
           caption = excluded.caption,
           width = excluded.width,
           height = excluded.height,
           size_bytes = excluded.size_bytes,
           updated_at = excluded.updated_at`
      )
      .bind(
        item.id,
        item.key || item.id,
        item.src,
        item.category,
        item.alt,
        item.caption || null,
        item.width || null,
        item.height || null,
        item.size || null,
        item.lastModified ? new Date(item.lastModified).getTime() : Date.now(),
        Date.now()
      )
      .run();
  } catch (error) {
    console.error('[D1] Error inserting gallery image:', error);
    throw error;
  }
}

/**
 * Delete a gallery image by key
 */
export async function deleteGalleryImage(db: D1Database, key: string): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM gallery_images WHERE key = ?')
      .bind(key)
      .run();
  } catch (error) {
    console.error('[D1] Error deleting gallery image:', error);
    throw error;
  }
}

/**
 * Get gallery images by category
 */
export async function getGalleryImages(db: D1Database, category: string): Promise<GalleryItem[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM gallery_images WHERE category = ? ORDER BY uploaded_at DESC')
      .bind(category)
      .all<any>();
    
    return (result.results || []).map(row => ({
      id: row.id,
      src: row.url,
      alt: row.alt,
      caption: row.caption || undefined,
      category: row.category as any,
      size: row.size_bytes,
      lastModified: new Date(row.uploaded_at).toISOString(),
      key: row.key
    }));
  } catch (error) {
    console.error('[D1] Error fetching gallery images:', error);
    return [];
  }
}

/**
 * Get all gallery images
 */
export async function getAllGalleryImages(db: D1Database): Promise<GalleryItem[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM gallery_images ORDER BY uploaded_at DESC')
      .all<any>();
    
    return (result.results || []).map(row => ({
      id: row.id,
      src: row.url,
      alt: row.alt,
      caption: row.caption || undefined,
      category: row.category as any,
      size: row.size_bytes,
      width: row.width,
      height: row.height,
      lastModified: new Date(row.uploaded_at).toISOString(),
      key: row.key
    }));
  } catch (error) {
    console.error('[D1] Error fetching all gallery images:', error);
    return [];
  }
}

// ============================================================================
// PRICING CRUD OPERATIONS
// ============================================================================

export interface CreateStyleInput {
  id: string;
  label: string;
  multiplier: number;
  description?: string | null;
  recommended_color_type?: string | null;
  sort_order?: number;
}

export interface UpdateStyleInput {
  label?: string;
  multiplier?: number;
  description?: string | null;
  recommended_color_type?: string | null;
  sort_order?: number;
}

/**
 * Create a new style
 */
export async function createStyle(db: D1Database, data: CreateStyleInput): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO styles (id, label, multiplier, description, recommended_color_type, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.label,
        data.multiplier,
        data.description ?? null,
        data.recommended_color_type ?? null,
        data.sort_order ?? 0
      )
      .run();
  } catch (error) {
    console.error('[D1] Error creating style:', error);
    // Check for UNIQUE constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`Style with ID "${data.id}" already exists`);
    }
    throw new Error('Failed to create style');
  }
}

/**
 * Update an existing style
 */
export async function updateStyle(db: D1Database, id: string, data: UpdateStyleInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.label !== undefined) { fields.push('label = ?'); values.push(data.label); }
  if (data.multiplier !== undefined) { fields.push('multiplier = ?'); values.push(data.multiplier); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.recommended_color_type !== undefined) { fields.push('recommended_color_type = ?'); values.push(data.recommended_color_type); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return;

  values.push(id);

  try {
    await db
      .prepare(`UPDATE styles SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('[D1] Error updating style:', error);
    throw new Error('Failed to update style');
  }
}

/**
 * Delete a style by ID
 */
export async function deleteStyle(db: D1Database, id: string): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM styles WHERE id = ?')
      .bind(id)
      .run();
  } catch (error) {
    console.error('[D1] Error deleting style:', error);
    throw new Error('Failed to delete style');
  }
}

export interface CreateSizeCategoryInput {
  id: string;
  label: string;
  min_price: number;
  max_price: number;
  description?: string | null;
  sort_order?: number;
}

export interface UpdateSizeCategoryInput {
  label?: string;
  min_price?: number;
  max_price?: number;
  description?: string | null;
  sort_order?: number;
}

/**
 * Create a new size category
 */
export async function createSizeCategory(db: D1Database, data: CreateSizeCategoryInput): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO size_categories (id, label, min_price, max_price, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.label,
        data.min_price,
        data.max_price,
        data.description ?? null,
        data.sort_order ?? 0
      )
      .run();
  } catch (error) {
    console.error('[D1] Error creating size category:', error);
    // Check for UNIQUE constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`Size category with ID "${data.id}" already exists`);
    }
    throw new Error('Failed to create size category');
  }
}

/**
 * Update an existing size category
 */
export async function updateSizeCategory(db: D1Database, id: string, data: UpdateSizeCategoryInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.label !== undefined) { fields.push('label = ?'); values.push(data.label); }
  if (data.min_price !== undefined) { fields.push('min_price = ?'); values.push(data.min_price); }
  if (data.max_price !== undefined) { fields.push('max_price = ?'); values.push(data.max_price); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return;

  values.push(id);

  try {
    await db
      .prepare(`UPDATE size_categories SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('[D1] Error updating size category:', error);
    throw new Error('Failed to update size category');
  }
}

/**
 * Delete a size category by ID
 */
export async function deleteSizeCategory(db: D1Database, id: string): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM size_categories WHERE id = ?')
      .bind(id)
      .run();
  } catch (error) {
    console.error('[D1] Error deleting size category:', error);
    throw new Error('Failed to delete size category');
  }
}

export interface CreateColorProfileInput {
  id: string;
  label: string;
  multiplier: number;
  description?: string | null;
  sort_order?: number;
}

export interface UpdateColorProfileInput {
  label?: string;
  multiplier?: number;
  description?: string | null;
  sort_order?: number;
}

/**
 * Create a new color profile
 */
export async function createColorProfile(db: D1Database, data: CreateColorProfileInput): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO color_profiles (id, label, multiplier, description, sort_order)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.label,
        data.multiplier,
        data.description ?? null,
        data.sort_order ?? 0
      )
      .run();
  } catch (error) {
    console.error('[D1] Error creating color profile:', error);
    // Check for UNIQUE constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`Color profile with ID "${data.id}" already exists`);
    }
    throw new Error('Failed to create color profile');
  }
}

/**
 * Update an existing color profile
 */
export async function updateColorProfile(db: D1Database, id: string, data: UpdateColorProfileInput): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.label !== undefined) { fields.push('label = ?'); values.push(data.label); }
  if (data.multiplier !== undefined) { fields.push('multiplier = ?'); values.push(data.multiplier); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return;

  values.push(id);

  try {
    await db
      .prepare(`UPDATE color_profiles SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('[D1] Error updating color profile:', error);
    throw new Error('Failed to update color profile');
  }
}

/**
 * Delete a color profile by ID
 */
export async function deleteColorProfile(db: D1Database, id: string): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM color_profiles WHERE id = ?')
      .bind(id)
      .run();
  } catch (error) {
    console.error('[D1] Error deleting color profile:', error);
    throw new Error('Failed to delete color profile');
  }
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

/**
 * Get a site setting by key
 */
export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  try {
    const result = await db
      .prepare('SELECT value FROM site_settings WHERE key = ?')
      .bind(key)
      .first<{ value: string | null }>();
    
    return result?.value ?? null;
  } catch (error) {
    console.error(`[D1] Error fetching setting ${key}:`, error);
    return null;
  }
}

/**
 * Set a site setting
 */
export async function setSetting(db: D1Database, key: string, value: string | null): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`
      )
      .bind(key, value, Date.now())
      .run();
  } catch (error) {
    console.error(`[D1] Error setting ${key}:`, error);
    throw new Error('Failed to update setting');
  }
}
