-- Migration: 002_seed_pricing_data
-- Description: Populate pricing tables with initial data from pricing.json
-- Date: 2025-11-22

-- Seed size_categories (8 categories)
INSERT INTO size_categories (id, label, min_price, max_price, description, sort_order) VALUES
('micro', 'Micro / Tiny (≤1" or ≤2.5cm)', 100, 200, 'Simple linework / minimal symbol', 1),
('small', 'Small (1–3" longest side)', 150, 300, 'Linework or small shaded; fine line detail adds time', 2),
('small_detailed', 'Small Detailed (2–4" high detail)', 300, 450, 'Mini portrait / intricate color or illustrative', 3),
('medium', 'Medium (4–6")', 500, 800, 'Forearm piece, mid-sized black & grey or simple color', 4),
('large_single', 'Large Single Session (6–8")', 800, 1200, 'Larger calf/upper arm piece; may go multi-session if realism', 5),
('half_sleeve', 'Half Sleeve / Large Multi-session', 1200, 2000, 'Complex composition upper or lower arm', 6),
('sleeve_or_back', 'Full Sleeve / Back Section / Large Project', 2000, 3500, 'Extensive multi-session color realism or illustrative', 7),
('major_project', 'Full Back / Multi-area Realism Project', 3500, 6000, 'Large-scale multi-session custom concept', 8);

-- Seed styles (16 styles)
INSERT INTO styles (id, label, multiplier, description, recommended_color_type, sort_order) VALUES
('minimal_line', 'Minimal linework', 1.0, 'Simple, single-line motifs and delicate punctuation', 'monochrome', 1),
('fine_line', 'Fine Line', 1.08, 'Delicate, precise lines and micro detail', 'monochrome', 2),
('linework', 'Linework', 1.05, 'Emphasis on outlines and clean shapes', 'monochrome', 3),
('traditional', 'Traditional (American)', 1.1, 'Bold lines and a limited color palette', 'color', 4),
('neo_traditional', 'Neo-Traditional', 1.15, 'Traditional motifs with more detail and shading', 'color', 5),
('blackwork', 'Blackwork', 1.15, 'Solid black fills and graphic patterns', 'monochrome', 6),
('geometric', 'Geometric', 1.1, 'Shapes, symmetry, and clean mathematical designs', 'monochrome', 7),
('japanese', 'Japanese (Irezumi)', 1.2, 'Large compositions with traditional motifs and layering', 'color', 8),
('tribal', 'Tribal', 1.05, 'Solid black, bold shapes with cultural motifs', 'monochrome', 9),
('realism_portrait', 'Realism / Portrait', 1.4, 'Photorealistic shading and color depth; high skill', 'color', 10),
('illustrative', 'Illustrative', 1.15, 'Sketch-like, detailed compositions with illustrative shading', 'color', 11),
('watercolor', 'Watercolor', 1.25, 'Soft, painterly color blending and layering', 'color', 12),
('dotwork', 'Dotwork', 1.18, 'Stippling and pointillism for texture and shading', 'monochrome', 13),
('script_lettering', 'Script / Lettering', 1.0, 'Typography work, often simpler but can be complex for intricate fonts', 'monochrome', 14),
('new_school', 'New School', 1.2, 'Cartoon-like, exaggerated palette and bold shading', 'color', 15),
('black_grey_shaded', 'Black & Grey shaded', 1.15, 'Shaded monochrome realism/shading techniques', 'monochrome', 16);

-- Seed color_profiles (5 profiles)
INSERT INTO color_profiles (id, label, multiplier, description, sort_order) VALUES
('monochrome_black_grey', 'Black & Grey / Monochrome', 1.0, 'Baseline pricing for black ink work', 1),
('grey_wash', 'Black & Grey (Greywash)', 1.05, 'Soft greywash shading for tonal variation', 2),
('limited_palette', 'Limited Color Palette', 1.12, 'Selective spot color or simple 2-3 color accents', 3),
('full_color', 'Full Color', 1.25, 'Multi-color composition with blending and saturation', 4),
('hyper_color_realism', 'Hyper-Realistic Color', 1.35, 'High-saturation layered realism with extensive color depth', 5);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (2, '002_seed_pricing_data');
