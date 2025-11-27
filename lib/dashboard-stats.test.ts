/**
 * @jest-environment node
 */

/**
 * Tests for dashboard statistics helpers
 */

import type { D1Database } from '../types/cloudflare';
import {
  getGalleryStats,
  getInquiryStats,
  getTemplateStats,
  getDashboardStats,
} from './dashboard-stats';

// Mock dependencies
jest.mock('./r2-server', () => ({
  listGalleryImages: jest.fn(),
}));

jest.mock('./db/d1', () => ({
  getD1Binding: jest.fn(),
}));

jest.mock('./db/inquiries', () => ({
  getUnreadCount: jest.fn(),
}));

jest.mock('./db/email-templates', () => ({
  getTemplates: jest.fn(),
}));

import { listGalleryImages } from './r2-server';
import { getD1Binding } from './db/d1';
import { getUnreadCount } from './db/inquiries';
import { getTemplates } from './db/email-templates';

const mockListGalleryImages = listGalleryImages as jest.MockedFunction<typeof listGalleryImages>;
const mockGetD1Binding = getD1Binding as jest.MockedFunction<typeof getD1Binding>;
const mockGetUnreadCount = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>;
const mockGetTemplates = getTemplates as jest.MockedFunction<typeof getTemplates>;

describe('dashboard-stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getGalleryStats', () => {
    it('returns counts for all gallery categories', async () => {
      mockListGalleryImages.mockImplementation((category: string) => {
        const counts: Record<string, number> = {
          flash: 5,
          healed: 3,
          available: 2,
          art: 4,
        };
        return {
          items: Array(counts[category] || 0).fill({ key: 'test.jpg', url: '' }),
          isFallback: false,
          usedBundledFallback: false,
          asPromise: () => Promise.resolve({
            items: Array(counts[category] || 0).fill({ key: 'test.jpg', url: '' }),
            truncated: false,
          }),
        };
      });

      const stats = await getGalleryStats();

      expect(stats).toEqual({
        flash: 5,
        healed: 3,
        available: 2,
        art: 4,
      });
      expect(mockListGalleryImages).toHaveBeenCalledWith('flash');
      expect(mockListGalleryImages).toHaveBeenCalledWith('healed');
      expect(mockListGalleryImages).toHaveBeenCalledWith('available');
      expect(mockListGalleryImages).toHaveBeenCalledWith('art');
    });

    it('returns zeros on error', async () => {
      mockListGalleryImages.mockRejectedValue(new Error('R2 error'));

      const stats = await getGalleryStats();

      expect(stats).toEqual({
        flash: 0,
        healed: 0,
        available: 0,
        art: 0,
      });
      expect(console.warn).toHaveBeenCalledWith(
        '[Dashboard] Failed to fetch gallery stats:',
        expect.any(Error)
      );
    });
  });

  describe('getInquiryStats', () => {
    it('returns unread count when database is available', async () => {
      const mockDb = {} as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);
      mockGetUnreadCount.mockResolvedValue(7);

      const stats = await getInquiryStats();

      expect(stats).toEqual({ unread: 7 });
      expect(mockGetUnreadCount).toHaveBeenCalledWith(mockDb);
    });

    it('returns zero when database is not available', async () => {
      mockGetD1Binding.mockReturnValue(undefined);

      const stats = await getInquiryStats();

      expect(stats).toEqual({ unread: 0 });
      expect(mockGetUnreadCount).not.toHaveBeenCalled();
    });

    it('returns zero on error', async () => {
      const mockDb = {} as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);
      mockGetUnreadCount.mockRejectedValue(new Error('D1 error'));

      const stats = await getInquiryStats();

      expect(stats).toEqual({ unread: 0 });
      expect(console.warn).toHaveBeenCalledWith(
        '[Dashboard] Failed to fetch inquiry stats:',
        expect.any(Error)
      );
    });
  });

  describe('getTemplateStats', () => {
    it('returns template count when database is available', async () => {
      const mockDb = {} as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);
      mockGetTemplates.mockResolvedValue([
        { id: 1, slug: 't1', name: 'Template 1', subject: '', body: '', is_default: 0, created_at: '', updated_at: '' },
        { id: 2, slug: 't2', name: 'Template 2', subject: '', body: '', is_default: 0, created_at: '', updated_at: '' },
        { id: 3, slug: 't3', name: 'Template 3', subject: '', body: '', is_default: 0, created_at: '', updated_at: '' },
      ]);

      const stats = await getTemplateStats();

      expect(stats).toEqual({ count: 3 });
      expect(mockGetTemplates).toHaveBeenCalledWith(mockDb);
    });

    it('returns zero when database is not available', async () => {
      mockGetD1Binding.mockReturnValue(undefined);

      const stats = await getTemplateStats();

      expect(stats).toEqual({ count: 0 });
      expect(mockGetTemplates).not.toHaveBeenCalled();
    });

    it('returns zero on error', async () => {
      const mockDb = {} as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);
      mockGetTemplates.mockRejectedValue(new Error('D1 error'));

      const stats = await getTemplateStats();

      expect(stats).toEqual({ count: 0 });
      expect(console.warn).toHaveBeenCalledWith(
        '[Dashboard] Failed to fetch template stats:',
        expect.any(Error)
      );
    });
  });

  describe('getDashboardStats', () => {
    it('aggregates all stats in one call', async () => {
      const mockDb = {} as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);

      mockListGalleryImages.mockImplementation((category: string) => {
        const counts: Record<string, number> = {
          flash: 10,
          healed: 5,
          available: 3,
          art: 8,
        };
        return {
          items: Array(counts[category] || 0).fill({ key: 'test.jpg', url: '' }),
          isFallback: false,
          usedBundledFallback: false,
          asPromise: () => Promise.resolve({
            items: Array(counts[category] || 0).fill({ key: 'test.jpg', url: '' }),
            truncated: false,
          }),
        };
      });

      mockGetUnreadCount.mockResolvedValue(2);
      mockGetTemplates.mockResolvedValue([
        { id: 1, slug: 't1', name: 'T1', subject: '', body: '', is_default: 0, created_at: '', updated_at: '' },
      ]);

      const stats = await getDashboardStats();

      expect(stats).toEqual({
        gallery: {
          flash: 10,
          healed: 5,
          available: 3,
          art: 8,
        },
        inquiries: {
          unread: 2,
        },
        templates: {
          count: 1,
        },
      });
    });

    it('handles partial failures gracefully', async () => {
      mockGetD1Binding.mockReturnValue(undefined);
      mockListGalleryImages.mockRejectedValue(new Error('R2 down'));

      const stats = await getDashboardStats();

      // All should return zero/default values
      expect(stats).toEqual({
        gallery: { flash: 0, healed: 0, available: 0, art: 0 },
        inquiries: { unread: 0 },
        templates: { count: 0 },
      });
    });
  });
});
