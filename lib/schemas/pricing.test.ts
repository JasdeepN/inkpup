/**
 * Tests for pricing Zod validation schemas
 */
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
} from './pricing';

describe('Pricing Schemas', () => {
  // ============================================================================
  // STYLE SCHEMAS
  // ============================================================================
  describe('CreateStyleSchema', () => {
    it('should validate a valid style', () => {
      const validStyle = {
        id: 'traditional',
        label: 'Traditional',
        multiplier: 1.0,
        description: 'Classic tattoo style',
        recommended_color_type: 'full-color',
        sort_order: 1,
      };

      const result = CreateStyleSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('traditional');
        expect(result.data.multiplier).toBe(1.0);
      }
    });

    it('should accept minimal required fields', () => {
      const minimalStyle = {
        id: 'minimal',
        label: 'Minimal Style',
        multiplier: 1.5,
      };

      const result = CreateStyleSchema.safeParse(minimalStyle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_order).toBe(0); // default
      }
    });

    it('should reject empty id', () => {
      const invalidStyle = {
        id: '',
        label: 'Test',
        multiplier: 1.0,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('id'))).toBe(true);
      }
    });

    it('should reject invalid id format (uppercase)', () => {
      const invalidStyle = {
        id: 'Traditional',
        label: 'Traditional',
        multiplier: 1.0,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should reject invalid id format (spaces)', () => {
      const invalidStyle = {
        id: 'my style',
        label: 'My Style',
        multiplier: 1.0,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should allow dashes and underscores in id', () => {
      const validStyle = {
        id: 'neo-traditional_v2',
        label: 'Neo Traditional V2',
        multiplier: 1.2,
      };

      const result = CreateStyleSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
    });

    it('should reject multiplier below 0.1', () => {
      const invalidStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 0.05,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should reject multiplier above 10', () => {
      const invalidStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 15,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should reject label over 100 characters', () => {
      const invalidStyle = {
        id: 'test',
        label: 'A'.repeat(101),
        multiplier: 1.0,
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should allow null description', () => {
      const validStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 1.0,
        description: null,
      };

      const result = CreateStyleSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
    });

    it('should transform empty recommended_color_type to null', () => {
      const validStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 1.0,
        recommended_color_type: '',
      };

      const result = CreateStyleSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recommended_color_type).toBeNull();
      }
    });

    it('should allow valid recommended_color_type format', () => {
      const validStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 1.0,
        recommended_color_type: 'black_grey',
      };

      const result = CreateStyleSchema.safeParse(validStyle);
      expect(result.success).toBe(true);
    });

    it('should reject recommended_color_type with uppercase', () => {
      const invalidStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 1.0,
        recommended_color_type: 'Full-Color',
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });

    it('should reject recommended_color_type with spaces', () => {
      const invalidStyle = {
        id: 'test',
        label: 'Test',
        multiplier: 1.0,
        recommended_color_type: 'full color',
      };

      const result = CreateStyleSchema.safeParse(invalidStyle);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateStyleSchema', () => {
    it('should validate partial update with id', () => {
      const update = {
        id: 'traditional',
        multiplier: 1.5,
      };

      const result = UpdateStyleSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const update = {
        multiplier: 1.5,
      };

      const result = UpdateStyleSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should allow updating only label', () => {
      const update = {
        id: 'traditional',
        label: 'Updated Label',
      };

      const result = UpdateStyleSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe('DeleteStyleSchema', () => {
    it('should validate delete with id', () => {
      const result = DeleteStyleSchema.safeParse({ id: 'traditional' });
      expect(result.success).toBe(true);
    });

    it('should reject empty id', () => {
      const result = DeleteStyleSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // SIZE CATEGORY SCHEMAS
  // ============================================================================
  describe('CreateSizeSchema', () => {
    it('should validate a valid size category', () => {
      const validSize = {
        id: 'small',
        label: 'Small (2-4 inches)',
        min_price: 100,
        max_price: 300,
        description: 'Perfect for first tattoos',
        sort_order: 1,
      };

      const result = CreateSizeSchema.safeParse(validSize);
      expect(result.success).toBe(true);
    });

    it('should reject max_price less than min_price', () => {
      const invalidSize = {
        id: 'invalid',
        label: 'Invalid Size',
        min_price: 500,
        max_price: 200,
      };

      const result = CreateSizeSchema.safeParse(invalidSize);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => 
          i.message.includes('Maximum price must be greater than or equal')
        )).toBe(true);
      }
    });

    it('should allow min_price equal to max_price', () => {
      const validSize = {
        id: 'flat-rate',
        label: 'Flat Rate',
        min_price: 250,
        max_price: 250,
      };

      const result = CreateSizeSchema.safeParse(validSize);
      expect(result.success).toBe(true);
    });

    it('should reject negative prices', () => {
      const invalidSize = {
        id: 'negative',
        label: 'Negative',
        min_price: -100,
        max_price: 200,
      };

      const result = CreateSizeSchema.safeParse(invalidSize);
      expect(result.success).toBe(false);
    });

    it('should reject prices over 100000', () => {
      const invalidSize = {
        id: 'expensive',
        label: 'Too Expensive',
        min_price: 0,
        max_price: 150000,
      };

      const result = CreateSizeSchema.safeParse(invalidSize);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateSizeSchema', () => {
    it('should validate partial update', () => {
      const update = {
        id: 'small',
        min_price: 150,
      };

      const result = UpdateSizeSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe('DeleteSizeSchema', () => {
    it('should validate delete with id', () => {
      const result = DeleteSizeSchema.safeParse({ id: 'small' });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // COLOR PROFILE SCHEMAS
  // ============================================================================
  describe('CreateColorSchema', () => {
    it('should validate a valid color profile', () => {
      const validColor = {
        id: 'full-color',
        label: 'Full Color',
        multiplier: 1.3,
        description: 'Vibrant full color work',
        sort_order: 1,
      };

      const result = CreateColorSchema.safeParse(validColor);
      expect(result.success).toBe(true);
    });

    it('should accept minimal required fields', () => {
      const minimalColor = {
        id: 'blackwork',
        label: 'Blackwork',
        multiplier: 1.0,
      };

      const result = CreateColorSchema.safeParse(minimalColor);
      expect(result.success).toBe(true);
    });

    it('should reject invalid id format', () => {
      const invalidColor = {
        id: 'Full Color',
        label: 'Full Color',
        multiplier: 1.0,
      };

      const result = CreateColorSchema.safeParse(invalidColor);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateColorSchema', () => {
    it('should validate partial update', () => {
      const update = {
        id: 'full-color',
        multiplier: 1.4,
      };

      const result = UpdateColorSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe('DeleteColorSchema', () => {
    it('should validate delete with id', () => {
      const result = DeleteColorSchema.safeParse({ id: 'full-color' });
      expect(result.success).toBe(true);
    });
  });
});
