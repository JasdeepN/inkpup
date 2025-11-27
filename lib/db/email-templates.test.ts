/**
 * @jest-environment node
 */

/**
 * Tests for D1 email template database functions
 */

import type { D1Database } from '../../types/cloudflare';
import {
  getTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from './email-templates';
import type { EmailTemplate, CreateTemplate } from '../schemas/inquiry';

describe('email-templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTemplates', () => {
    it('returns all templates ordered by default flag then name', async () => {
      const mockTemplates: EmailTemplate[] = [
        { id: 1, slug: 'default', name: 'Default', subject: 'Hi', body: 'Hello', is_default: 1, created_at: '', updated_at: '' },
        { id: 2, slug: 'custom', name: 'Custom', subject: 'Hey', body: 'World', is_default: 0, created_at: '', updated_at: '' },
      ];

      const db = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue({ results: mockTemplates }),
        }),
      } as unknown as D1Database;

      const result = await getTemplates(db);

      expect(result).toEqual(mockTemplates);
      expect(db.prepare).toHaveBeenCalledWith(
        'SELECT * FROM email_templates ORDER BY is_default DESC, name ASC'
      );
    });

    it('returns empty array on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      } as unknown as D1Database;

      const result = await getTemplates(db);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('[D1] Error fetching templates:', expect.any(Error));
    });

    it('returns empty array when results is undefined', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue({}),
        }),
      } as unknown as D1Database;

      const result = await getTemplates(db);

      expect(result).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    it('returns template when found', async () => {
      const mockTemplate: EmailTemplate = {
        id: 5,
        slug: 'welcome',
        name: 'Welcome',
        subject: 'Welcome!',
        body: 'Welcome to our shop',
        is_default: 0,
        created_at: '',
        updated_at: '',
      };

      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockTemplate),
          }),
        }),
      } as unknown as D1Database;

      const result = await getTemplateById(db, 5);

      expect(result).toEqual(mockTemplate);
    });

    it('returns null when not found', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await getTemplateById(db, 999);

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

      const result = await getTemplateById(db, 1);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getTemplateBySlug', () => {
    it('returns template when found by slug', async () => {
      const mockTemplate: EmailTemplate = {
        id: 3,
        slug: 'thank-you',
        name: 'Thank You',
        subject: 'Thanks!',
        body: 'Thank you for your inquiry',
        is_default: 0,
        created_at: '',
        updated_at: '',
      };

      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockTemplate),
          }),
        }),
      } as unknown as D1Database;

      const result = await getTemplateBySlug(db, 'thank-you');

      expect(result).toEqual(mockTemplate);
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM email_templates WHERE slug = ?');
    });

    it('returns null when not found', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await getTemplateBySlug(db, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTemplate', () => {
    it('creates template and returns id', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({ id: 10 }),
          }),
        }),
      } as unknown as D1Database;

      const data: CreateTemplate = {
        slug: 'new-template',
        name: 'New Template',
        subject: 'Subject',
        body: 'Body content',
      };

      const result = await createTemplate(db, data);

      expect(result).toEqual({ id: 10 });
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO email_templates')
      );
    });

    it('returns null on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockRejectedValue(new Error('Constraint error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await createTemplate(db, {
        slug: 'dup',
        name: 'Dup',
        subject: 's',
        body: 'b',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    it('updates template fields', async () => {
      const mockBind = jest.fn().mockReturnValue({
        run: jest.fn().mockResolvedValue({ success: true }),
      });
      const db = {
        prepare: jest.fn().mockReturnValue({ bind: mockBind }),
      } as unknown as D1Database;

      const result = await updateTemplate(db, 1, {
        name: 'Updated Name',
        subject: 'Updated Subject',
      });

      expect(result).toBe(true);
      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE email_templates SET')
      );
    });

    it('returns true when no fields to update', async () => {
      const db = {
        prepare: jest.fn(),
      } as unknown as D1Database;

      const result = await updateTemplate(db, 1, {});

      expect(result).toBe(true);
      expect(db.prepare).not.toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            run: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      } as unknown as D1Database;

      const result = await updateTemplate(db, 1, { name: 'Test' });

      expect(result).toBe(false);
    });
  });

  describe('deleteTemplate', () => {
    it('deletes non-default template successfully', async () => {
      const db = {
        prepare: jest.fn().mockImplementation((query: string) => {
          if (query.includes('SELECT')) {
            return {
              bind: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({
                  id: 5,
                  is_default: 0,
                }),
              }),
            };
          }
          return {
            bind: jest.fn().mockReturnValue({
              run: jest.fn().mockResolvedValue({ success: true }),
            }),
          };
        }),
      } as unknown as D1Database;

      const result = await deleteTemplate(db, 5);

      expect(result).toEqual({ success: true });
    });

    it('refuses to delete default template', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue({
              id: 1,
              is_default: 1,
              name: 'Default Template',
            }),
          }),
        }),
      } as unknown as D1Database;

      const result = await deleteTemplate(db, 1);

      expect(result).toEqual({
        success: false,
        error: 'Cannot delete default templates',
      });
    });

    it('returns error when template not found', async () => {
      const db = {
        prepare: jest.fn().mockReturnValue({
          bind: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      } as unknown as D1Database;

      const result = await deleteTemplate(db, 999);

      expect(result).toEqual({
        success: false,
        error: 'Template not found',
      });
    });

    it('returns error on database failure', async () => {
      // First call (getTemplateById) succeeds, second call (delete) fails
      const db = {
        prepare: jest.fn().mockImplementation((query: string) => {
          if (query.includes('SELECT')) {
            return {
              bind: jest.fn().mockReturnValue({
                first: jest.fn().mockResolvedValue({
                  id: 1,
                  is_default: 0,
                }),
              }),
            };
          }
          return {
            bind: jest.fn().mockReturnValue({
              run: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
          };
        }),
      } as unknown as D1Database;

      const result = await deleteTemplate(db, 1);

      expect(result).toEqual({
        success: false,
        error: 'Database error',
      });
    });
  });
});
