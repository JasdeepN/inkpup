/**
 * @jest-environment node
 */

/**
 * Tests for D1 inquiry database functions
 */

import type { D1Database } from '../../types/cloudflare';
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  updateInquiryNotes,
  getUnreadCount,
  deleteInquiry,
  createInquiryWithBinding,
} from './inquiries';
import type { CreateInquiry, Inquiry } from '../schemas/inquiry';

// Mock D1 binding helper
jest.mock('./d1', () => ({
  getD1Binding: jest.fn(),
}));

import { getD1Binding } from './d1';
const mockGetD1Binding = getD1Binding as jest.MockedFunction<typeof getD1Binding>;

// Helper to create mock D1Database
function createMockDb(overrides?: Partial<D1Database>): D1Database {
  const mockFirst = jest.fn();
  const mockAll = jest.fn();
  const mockRun = jest.fn();
  const mockBind = jest.fn().mockReturnValue({
    first: mockFirst,
    all: mockAll,
    run: mockRun,
  });

  const db = {
    prepare: jest.fn().mockReturnValue({
      bind: mockBind,
      first: mockFirst,
      all: mockAll,
      run: mockRun,
    }),
    ...overrides,
  } as unknown as D1Database;

  return db;
}

describe('inquiries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createInquiry', () => {
    it('creates an inquiry and returns the id', async () => {
      const mockFirst = jest.fn().mockResolvedValue({ id: 42 });
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: mockFirst,
          }),
        }),
      } as unknown as D1Database;

      const data: CreateInquiry = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        inquiry_type: 'custom',
        message: 'I want a tattoo',
        placement: 'arm',
        budget: '200-500',
      };

      const result = await createInquiry(db, data);

      expect(result).toEqual({ id: 42 });
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO inquiries'));
    });

    it('handles null optional fields', async () => {
      const mockBind = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1 }),
      });
      const db = {
        prepare: jest.fn().mockReturnValue({ bind: mockBind }),
      } as unknown as D1Database;

      const data: CreateInquiry = {
        name: 'Jane',
        email: 'jane@example.com',
      };

      await createInquiry(db, data);

      // Check that bind was called with null for optional fields
      expect(mockBind).toHaveBeenCalledWith(
        'Jane',
        'jane@example.com',
        null, // phone
        'contact', // default inquiry_type
        null, // design_id
        null, // message
        null, // placement
        null  // budget
      );
    });

    it('returns null on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await createInquiry(db, { name: 'Test', email: 'test@test.com' });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('[D1] Error creating inquiry:', expect.any(Error));
    });
  });

  describe('getInquiries', () => {
    const mockInquiries: Inquiry[] = [
      {
        id: 1,
        name: 'User1',
        email: 'user1@test.com',
        phone: null,
        inquiry_type: 'contact',
        design_id: null,
        message: 'Hello',
        placement: null,
        budget: null,
        status: 'unread',
        notes: null,
        created_at: '2024-01-01',
        replied_at: null,
      },
    ];

    it('fetches all inquiries without filter', async () => {
      const mockAll = jest.fn().mockResolvedValue({ results: mockInquiries });
      const db = {
        prepare: jest.fn().mockReturnValue({
          all: mockAll,
          bind: jest.fn().mockReturnValue({ all: mockAll }),
        }),
      } as unknown as D1Database;

      const result = await getInquiries(db);

      expect(result).toEqual(mockInquiries);
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY created_at DESC'));
    });

    it('fetches inquiries with status filter', async () => {
      const mockAll = jest.fn().mockResolvedValue({ results: mockInquiries });
      const mockBind = jest.fn().mockReturnValue({ all: mockAll });
      const db = {
        prepare: jest.fn().mockReturnValue({ bind: mockBind, all: mockAll }),
      } as unknown as D1Database;

      const result = await getInquiries(db, 'unread');

      expect(result).toEqual(mockInquiries);
      expect(mockBind).toHaveBeenCalledWith('unread');
    });

    it('returns empty array on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockRejectedValue(new Error('DB error')),
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await getInquiries(db);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getInquiryById', () => {
    it('returns inquiry when found', async () => {
      const mockInquiry = { id: 5, name: 'Test', email: 'test@test.com', status: 'unread' };
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockInquiry),
          }),
        }),
      } as unknown as D1Database;

      const result = await getInquiryById(db, 5);

      expect(result).toEqual(mockInquiry);
    });

    it('returns null when not found', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await getInquiryById(db, 999);

      expect(result).toBeNull();
    });
  });

  describe('updateInquiryStatus', () => {
    it('updates status successfully', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockResolvedValue({ success: true }),
          }),
        }),
      } as unknown as D1Database;

      const result = await updateInquiryStatus(db, 1, 'read');

      expect(result).toBe(true);
    });

    it('sets replied_at when marking as replied', async () => {
      const mockBind = jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue({ success: true }),
      });
      const db = {
        prepare: jest.fn().mockReturnValue({ bind: mockBind }),
      } as unknown as D1Database;

      await updateInquiryStatus(db, 1, 'replied');

      // Should include replied_at in the query
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('replied_at = CURRENT_TIMESTAMP')
      );
    });

    it('returns false on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await updateInquiryStatus(db, 1, 'read');

      expect(result).toBe(false);
    });
  });

  describe('updateInquiryNotes', () => {
    it('updates notes successfully', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockResolvedValue({ success: true }),
          }),
        }),
      } as unknown as D1Database;

      const result = await updateInquiryNotes(db, 1, 'Some internal notes');

      expect(result).toBe(true);
    });

    it('returns false on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await updateInquiryNotes(db, 1, 'notes');

      expect(result).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread inquiries', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ count: 5 }),
          }),
        }),
      } as unknown as D1Database;

      const result = await getUnreadCount(db);

      expect(result).toBe(5);
    });

    it('returns 0 when no result', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await getUnreadCount(db);

      expect(result).toBe(0);
    });

    it('returns 0 on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await getUnreadCount(db);

      expect(result).toBe(0);
    });
  });

  describe('deleteInquiry', () => {
    it('deletes inquiry successfully', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockResolvedValue({ success: true }),
          }),
        }),
      } as unknown as D1Database;

      const result = await deleteInquiry(db, 1);

      expect(result).toBe(true);
      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM inquiries WHERE id = ?');
    });

    it('returns false on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await deleteInquiry(db, 1);

      expect(result).toBe(false);
    });
  });

  describe('createInquiryWithBinding', () => {
    it('creates inquiry when binding is available', async () => {
      const mockFirst = jest.fn().mockResolvedValue({ id: 99 });
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({ first: mockFirst }),
        }),
      } as unknown as D1Database;
      mockGetD1Binding.mockReturnValue(mockDb);

      const result = await createInquiryWithBinding({
        name: 'Test',
        email: 'test@test.com',
      });

      expect(result).toEqual({ id: 99 });
    });

    it('returns null when binding is not available', async () => {
      mockGetD1Binding.mockReturnValue(null);

      const result = await createInquiryWithBinding({
        name: 'Test',
        email: 'test@test.com',
      });

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('[D1] Database not available for inquiry creation');
    });
  });
});
