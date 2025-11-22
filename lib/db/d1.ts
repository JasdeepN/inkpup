/**
 * D1 Database Client Wrapper
 * Provides type-safe queries for pricing data
 */

import type { D1Database, SizeCategory, Style, ColorProfile } from '../../types/cloudflare';

/**
 * Get D1 database binding from Cloudflare Workers environment
 * Falls back to undefined if not available (e.g., in Node.js environment)
 */
export function getD1Binding(): D1Database | undefined {
  // In Cloudflare Workers context, the binding is available via process.env
  if (typeof process !== 'undefined' && process.env?.DB) {
    return process.env.DB as unknown as D1Database;
  }
  
  // In middleware/edge runtime, check globalThis
  if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
    return (globalThis as any).DB as D1Database;
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
