/**
 * @jest-environment node
 */

/**
 * Tests for D1 inquiry email database functions
 */

import type { D1Database } from '../../types/cloudflare';
import {
  createInquiryEmail,
  getEmailsByInquiryId,
  getLatestEmailForInquiry,
  getEmailCountForInquiry,
} from './inquiry-emails';
import type { InquiryEmail, CreateInquiryEmail } from '../schemas/inquiry';

describe('inquiry-emails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createInquiryEmail', () => {
    it('creates email record and returns id', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: 15 }),
          }),
        }),
      } as unknown as D1Database;

      const data: CreateInquiryEmail = {
        inquiry_id: 1,
        template_id: 2,
        subject: 'Re: Your inquiry',
        body: 'Thank you for reaching out',
      };

      const result = await createInquiryEmail(db, data);

      expect(result).toEqual({ id: 15 });
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inquiry_emails')
      );
    });

    it('handles null template_id', async () => {
      const mockBind = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 20 }),
      });
      const db = {
        prepare: jest.fn().mockReturnValue({ bind: mockBind }),
      } as unknown as D1Database;

      const data: CreateInquiryEmail = {
        inquiry_id: 5,
        subject: 'Custom reply',
        body: 'Custom message',
      };

      await createInquiryEmail(db, data);

      // Should pass null for template_id, default 'outbound' for direction, null for from_email and resend_email_id
      expect(mockBind).toHaveBeenCalledWith(5, null, 'Custom reply', 'Custom message', 'outbound', null, null);
    });

    it('returns null on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockRejectedValue(new Error('FK constraint')),
          }),
        }),
      } as unknown as D1Database;

      const result = await createInquiryEmail(db, {
        inquiry_id: 999,
        subject: 'Test',
        body: 'Test',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[D1] Error creating inquiry email record:',
        expect.any(Error)
      );
    });
  });

  describe('getEmailsByInquiryId', () => {
    it('returns emails with template names', async () => {
      const mockEmails: (InquiryEmail & { template_name?: string })[] = [
        {
          id: 1,
          inquiry_id: 5,
          template_id: 1,
          subject: 'First reply',
          body: 'Hello',
          sent_at: '2024-01-01T10:00:00Z',
          template_name: 'Welcome',
        },
        {
          id: 2,
          inquiry_id: 5,
          template_id: null,
          subject: 'Follow up',
          body: 'Following up',
          sent_at: '2024-01-02T10:00:00Z',
          template_name: undefined,
        },
      ];

      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue({ results: mockEmails }),
          }),
        }),
      } as unknown as D1Database;

      const result = await getEmailsByInquiryId(db, 5);

      expect(result).toEqual(mockEmails);
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN email_templates')
      );
    });

    it('returns empty array when no emails', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue({ results: [] }),
          }),
        }),
      } as unknown as D1Database;

      const result = await getEmailsByInquiryId(db, 99);

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            all: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await getEmailsByInquiryId(db, 1);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getLatestEmailForInquiry', () => {
    it('returns the most recent email', async () => {
      const mockEmail: InquiryEmail = {
        id: 10,
        inquiry_id: 3,
        template_id: 1,
        subject: 'Latest',
        body: 'Most recent message',
        sent_at: '2024-01-15T12:00:00Z',
      };

      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockEmail),
          }),
        }),
      } as unknown as D1Database;

      const result = await getLatestEmailForInquiry(db, 3);

      expect(result).toEqual(mockEmail);
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY sent_at DESC')
      );
    });

    it('returns null when no emails exist', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await getLatestEmailForInquiry(db, 999);

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await getLatestEmailForInquiry(db, 1);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getEmailCountForInquiry', () => {
    it('returns count of emails for inquiry', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ count: 5 }),
          }),
        }),
      } as unknown as D1Database;

      const result = await getEmailCountForInquiry(db, 7);

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

      const result = await getEmailCountForInquiry(db, 1);

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

      const result = await getEmailCountForInquiry(db, 1);

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
