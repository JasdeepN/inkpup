-- Migration: 001_create_pricing_tables
-- Description: Create tables for pricing data (size categories, styles, color profiles)
-- Date: 2025-11-22

-- Create size_categories table
CREATE TABLE IF NOT EXISTS size_categories (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  min_price INTEGER NOT NULL,
  max_price INTEGER NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_size_categories_sort_order ON size_categories(sort_order);

-- Create styles table
CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  multiplier REAL NOT NULL,
  description TEXT,
  recommended_color_type TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_styles_sort_order ON styles(sort_order);

-- Create color_profiles table
CREATE TABLE IF NOT EXISTS color_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  multiplier REAL NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_color_profiles_sort_order ON color_profiles(sort_order);

-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (1, '001_create_pricing_tables');
