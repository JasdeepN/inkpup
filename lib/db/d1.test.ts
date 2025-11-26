/**
 * Tests for D1 database functions
 */
import type { D1Database } from '../../types/cloudflare';
import {
  getD1Binding,
  getSizeCategories,
  getStyles,
  getColorProfiles,
  getSizeCategoryById,
  getStyleById,
  getColorProfileById,
  insertGalleryImage,
  deleteGalleryImage,
  getGalleryImages,
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
} from './d1';
import type { GalleryItem } from '../gallery-types';

// Local type aliases for test mocks (include all required fields)
type MockSizeCategory = {
  id: string;
  label: string;
  min_price: number;
  max_price: number;
  description: string | null;
  sort_order: number;
};

type MockStyle = {
  id: string;
  label: string;
  multiplier: number;
  description: string | null;
  recommended_color_type: string | null;
  sort_order: number;
};

type MockColorProfile = {
  id: string;
  label: string;
  multiplier: number;
  description: string | null;
  sort_order: number;
};

describe('D1 Database Functions', () => {
  // ============================================================================
  // getD1Binding TESTS
  // ============================================================================
  describe('getD1Binding', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete (globalThis as any).DB;
      delete (process.env as any).DB;
    });

    afterEach(() => {
      process.env = originalEnv;
      delete (globalThis as any).DB;
    });

    it('should return undefined when no binding available', () => {
      const binding = getD1Binding();
      expect(binding).toBeUndefined();
    });

    it('should return process.env.DB if available', () => {
      const mockDB = { prepare: jest.fn() };
      (process.env as any).DB = mockDB;

      const binding = getD1Binding();
      expect(binding).toBe(mockDB);
    });

    it('should return globalThis.DB if available', () => {
      const mockDB = { prepare: jest.fn() };
      (globalThis as any).DB = mockDB;

      const binding = getD1Binding();
      expect(binding).toBe(mockDB);
    });
  });

  // ============================================================================
  // READ OPERATIONS TESTS
  // ============================================================================
  describe('Read Operations', () => {
    let mockDB: jest.Mocked<D1Database>;
    let mockStatement: any;

    beforeEach(() => {
      mockStatement = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn(),
        all: jest.fn(),
        run: jest.fn(),
      };
      mockDB = {
        prepare: jest.fn(() => mockStatement),
      } as unknown as jest.Mocked<D1Database>;
    });

    describe('getSizeCategories', () => {
      it('should return size categories from D1', async () => {
        const mockCategories: MockSizeCategory[] = [
          { id: 'small', label: 'Small', min_price: 100, max_price: 300, description: null, sort_order: 1 },
          { id: 'medium', label: 'Medium', min_price: 300, max_price: 600, description: null, sort_order: 2 },
        ];
        mockStatement.all.mockResolvedValue({ results: mockCategories });

        const result = await getSizeCategories(mockDB);

        expect(mockDB.prepare).toHaveBeenCalledWith(
          'SELECT * FROM size_categories ORDER BY sort_order ASC'
        );
        expect(result).toEqual(mockCategories);
      });

      it('should return empty array on empty results', async () => {
        mockStatement.all.mockResolvedValue({ results: [] });

        const result = await getSizeCategories(mockDB);
        expect(result).toEqual([]);
      });

      it('should throw on database error', async () => {
        mockStatement.all.mockRejectedValue(new Error('DB error'));

        await expect(getSizeCategories(mockDB)).rejects.toThrow(
          'Failed to fetch size categories from database'
        );
      });
    });

    describe('getStyles', () => {
      it('should return styles from D1', async () => {
        const mockStyles: MockStyle[] = [
          { id: 'traditional', label: 'Traditional', multiplier: 1.0, description: null, recommended_color_type: null, sort_order: 1 },
        ];
        mockStatement.all.mockResolvedValue({ results: mockStyles });

        const result = await getStyles(mockDB);

        expect(mockDB.prepare).toHaveBeenCalledWith(
          'SELECT * FROM styles ORDER BY sort_order ASC'
        );
        expect(result).toEqual(mockStyles);
      });
    });

    describe('getColorProfiles', () => {
      it('should return color profiles from D1', async () => {
        const mockColors: MockColorProfile[] = [
          { id: 'blackwork', label: 'Blackwork', multiplier: 1.0, description: null, sort_order: 1 },
        ];
        mockStatement.all.mockResolvedValue({ results: mockColors });

        const result = await getColorProfiles(mockDB);

        expect(mockDB.prepare).toHaveBeenCalledWith(
          'SELECT * FROM color_profiles ORDER BY sort_order ASC'
        );
        expect(result).toEqual(mockColors);
      });
    });

    describe('getSizeCategoryById', () => {
      it('should return size category by id', async () => {
        const mockCategory: MockSizeCategory = {
          id: 'small',
          label: 'Small',
          min_price: 100,
          max_price: 300,
          description: null,
          sort_order: 1,
        };
        mockStatement.first.mockResolvedValue(mockCategory);

        const result = await getSizeCategoryById(mockDB, 'small');

        expect(mockStatement.bind).toHaveBeenCalledWith('small');
        expect(result).toEqual(mockCategory);
      });

      it('should return null if not found', async () => {
        mockStatement.first.mockResolvedValue(null);

        const result = await getSizeCategoryById(mockDB, 'nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('getStyleById', () => {
      it('should return style by id', async () => {
        const mockStyle: MockStyle = {
          id: 'traditional',
          label: 'Traditional',
          multiplier: 1.0,
          description: null,
          recommended_color_type: null,
          sort_order: 1,
        };
        mockStatement.first.mockResolvedValue(mockStyle);

        const result = await getStyleById(mockDB, 'traditional');
        expect(result).toEqual(mockStyle);
      });
    });

    describe('getColorProfileById', () => {
      it('should return color profile by id', async () => {
        const mockColor: MockColorProfile = {
          id: 'blackwork',
          label: 'Blackwork',
          multiplier: 1.0,
          description: null,
          sort_order: 1,
        };
        mockStatement.first.mockResolvedValue(mockColor);

        const result = await getColorProfileById(mockDB, 'blackwork');
        expect(result).toEqual(mockColor);
      });
    });
  });

  // ============================================================================
  // GALLERY OPERATIONS TESTS
  // ============================================================================
  describe('Gallery Operations', () => {
    let mockDB: jest.Mocked<D1Database>;
    let mockStatement: any;

    beforeEach(() => {
      mockStatement = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn(),
        all: jest.fn(),
        run: jest.fn(),
      };
      mockDB = {
        prepare: jest.fn(() => mockStatement),
      } as unknown as jest.Mocked<D1Database>;
    });

    describe('insertGalleryImage', () => {
      it('should insert a gallery image', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        const item: GalleryItem = {
          id: 'img-1',
          key: 'hero/img-1.jpg',
          src: 'https://example.com/img-1.jpg',
          alt: 'Test image',
          category: 'hero',
          size: 12345,
          width: 800,
          height: 600,
          lastModified: '2024-01-15T10:00:00Z',
        };

        await insertGalleryImage(mockDB, item);

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.bind).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });

      it('should throw on error', async () => {
        mockStatement.run.mockRejectedValue(new Error('Insert failed'));

        const item: GalleryItem = {
          id: 'img-1',
          src: '/img.jpg',
          alt: 'Test',
          category: 'flash',
        };

        await expect(insertGalleryImage(mockDB, item)).rejects.toThrow('Insert failed');
      });
    });

    describe('deleteGalleryImage', () => {
      it('should delete a gallery image by key', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await deleteGalleryImage(mockDB, 'hero/img-1.jpg');

        expect(mockDB.prepare).toHaveBeenCalledWith('DELETE FROM gallery_images WHERE key = ?');
        expect(mockStatement.bind).toHaveBeenCalledWith('hero/img-1.jpg');
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('getGalleryImages', () => {
      it('should return gallery images by category', async () => {
        const mockRows = [
          {
            id: 'img-1',
            key: 'hero/img-1.jpg',
            url: '/img-1.jpg',
            alt: 'Image 1',
            caption: 'Caption 1',
            category: 'hero',
            size_bytes: 12345,
            uploaded_at: Date.now(),
          },
        ];
        mockStatement.all.mockResolvedValue({ results: mockRows });

        const result = await getGalleryImages(mockDB, 'hero');

        expect(mockStatement.bind).toHaveBeenCalledWith('hero');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('img-1');
        expect(result[0].src).toBe('/img-1.jpg');
      });
    });
  });

  // ============================================================================
  // CRUD OPERATIONS TESTS
  // ============================================================================
  describe('CRUD Operations', () => {
    let mockDB: jest.Mocked<D1Database>;
    let mockStatement: any;

    beforeEach(() => {
      mockStatement = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn(),
        all: jest.fn(),
        run: jest.fn(),
      };
      mockDB = {
        prepare: jest.fn(() => mockStatement),
      } as unknown as jest.Mocked<D1Database>;
    });

    describe('createStyle', () => {
      it('should insert a new style', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await createStyle(mockDB, {
          id: 'new-style',
          label: 'New Style',
          multiplier: 1.5,
          sort_order: 1,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('updateStyle', () => {
      it('should update an existing style', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await updateStyle(mockDB, 'traditional', {
          label: 'Updated Label',
          multiplier: 1.2,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('deleteStyle', () => {
      it('should delete a style by id', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await deleteStyle(mockDB, 'traditional');

        expect(mockDB.prepare).toHaveBeenCalledWith('DELETE FROM styles WHERE id = ?');
        expect(mockStatement.bind).toHaveBeenCalledWith('traditional');
      });
    });

    describe('createSizeCategory', () => {
      it('should insert a new size category', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await createSizeCategory(mockDB, {
          id: 'new-size',
          label: 'New Size',
          min_price: 100,
          max_price: 200,
          sort_order: 1,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('updateSizeCategory', () => {
      it('should update an existing size category', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await updateSizeCategory(mockDB, 'small', {
          min_price: 150,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('deleteSizeCategory', () => {
      it('should delete a size category by id', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await deleteSizeCategory(mockDB, 'small');

        expect(mockDB.prepare).toHaveBeenCalledWith('DELETE FROM size_categories WHERE id = ?');
      });
    });

    describe('createColorProfile', () => {
      it('should insert a new color profile', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await createColorProfile(mockDB, {
          id: 'new-color',
          label: 'New Color',
          multiplier: 1.3,
          sort_order: 1,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('updateColorProfile', () => {
      it('should update an existing color profile', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await updateColorProfile(mockDB, 'blackwork', {
          multiplier: 1.1,
        });

        expect(mockDB.prepare).toHaveBeenCalled();
        expect(mockStatement.run).toHaveBeenCalled();
      });
    });

    describe('deleteColorProfile', () => {
      it('should delete a color profile by id', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await deleteColorProfile(mockDB, 'blackwork');

        expect(mockDB.prepare).toHaveBeenCalledWith('DELETE FROM color_profiles WHERE id = ?');
      });
    });
  });

  // ============================================================================
  // SETTINGS OPERATIONS TESTS
  // ============================================================================
  describe('Settings Operations', () => {
    let mockDB: jest.Mocked<D1Database>;
    let mockStatement: any;

    beforeEach(() => {
      mockStatement = {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn(),
        all: jest.fn(),
        run: jest.fn(),
      };
      mockDB = {
        prepare: jest.fn(() => mockStatement),
      } as unknown as jest.Mocked<D1Database>;
    });

    describe('getSetting', () => {
      it('should return setting value by key', async () => {
        mockStatement.first.mockResolvedValue({ value: 'hero/featured.jpg' });

        const result = await getSetting(mockDB, 'active_hero_id');

        expect(mockStatement.bind).toHaveBeenCalledWith('active_hero_id');
        expect(result).toBe('hero/featured.jpg');
      });

      it('should return null if setting not found', async () => {
        mockStatement.first.mockResolvedValue(null);

        const result = await getSetting(mockDB, 'nonexistent');
        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        mockStatement.first.mockRejectedValue(new Error('DB error'));

        const result = await getSetting(mockDB, 'some_key');
        expect(result).toBeNull();
      });
    });

    describe('setSetting', () => {
      it('should upsert a setting', async () => {
        mockStatement.run.mockResolvedValue({ success: true });

        await setSetting(mockDB, 'active_hero_id', 'hero/new-hero.jpg');

        expect(mockDB.prepare).toHaveBeenCalled();
        // setSetting also passes a timestamp, so we just check the first two args
        expect(mockStatement.bind).toHaveBeenCalled();
        expect(mockStatement.bind.mock.calls[0][0]).toBe('active_hero_id');
        expect(mockStatement.bind.mock.calls[0][1]).toBe('hero/new-hero.jpg');
        expect(mockStatement.run).toHaveBeenCalled();
      });

      it('should throw on error', async () => {
        mockStatement.run.mockRejectedValue(new Error('Insert failed'));

        await expect(setSetting(mockDB, 'key', 'value')).rejects.toThrow('Failed to update setting');
      });
    });
  });
});
