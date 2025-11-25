-- Migration: 004_create_site_settings
-- Description: Create site_settings table for runtime configuration (hero selection, etc.)
-- Date: 2025-11-25

-- Create site_settings table for key-value configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create index on updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_at ON site_settings(updated_at);

-- Insert default settings (active_hero_id = null means use first image)
INSERT OR IGNORE INTO site_settings (key, value, updated_at)
VALUES ('active_hero_id', NULL, strftime('%s', 'now'));

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (4, '004_create_site_settings');
