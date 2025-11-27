/**
 * Dashboard Statistics Helpers
 * Fetches counts for gallery categories, inquiries, and templates
 * @module lib/dashboard-stats
 */

import { listGalleryImages } from './r2-server';
import { getD1Binding } from './db/d1';
import { getUnreadCount } from './db/inquiries';
import { getTemplates } from './db/email-templates';

export interface GalleryStats {
  flash: number;
  healed: number;
  available: number;
  art: number;
}

export interface InquiryStats {
  unread: number;
}

export interface TemplateStats {
  count: number;
}

export interface DashboardStats {
  gallery: GalleryStats;
  inquiries: InquiryStats;
  templates: TemplateStats;
}

/**
 * Get gallery image counts by category
 * Categories: flash, healed, available, art (hero is internal)
 */
export async function getGalleryStats(): Promise<GalleryStats> {
  try {
    const [flashResult, healedResult, availableResult, artResult] = await Promise.all([
      listGalleryImages('flash'),
      listGalleryImages('healed'),
      listGalleryImages('available'),
      listGalleryImages('art'),
    ]);

    return {
      flash: flashResult.items.length,
      healed: healedResult.items.length,
      available: availableResult.items.length,
      art: artResult.items.length,
    };
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch gallery stats:', error);
    return { flash: 0, healed: 0, available: 0, art: 0 };
  }
}

/**
 * Get inquiry inbox stats (unread count)
 */
export async function getInquiryStats(): Promise<InquiryStats> {
  try {
    const db = getD1Binding();
    if (!db) {
      return { unread: 0 };
    }
    const unread = await getUnreadCount(db);
    return { unread };
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch inquiry stats:', error);
    return { unread: 0 };
  }
}

/**
 * Get template count
 */
export async function getTemplateStats(): Promise<TemplateStats> {
  try {
    const db = getD1Binding();
    if (!db) {
      return { count: 0 };
    }
    const templates = await getTemplates(db);
    return { count: templates.length };
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch template stats:', error);
    return { count: 0 };
  }
}

/**
 * Get all dashboard stats in one call
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [gallery, inquiries, templates] = await Promise.all([
    getGalleryStats(),
    getInquiryStats(),
    getTemplateStats(),
  ]);

  return { gallery, inquiries, templates };
}
