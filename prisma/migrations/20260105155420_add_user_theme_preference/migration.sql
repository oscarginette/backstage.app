-- Add theme preference column to users table
-- Default to 'system' (respects OS preference)
-- Migration: 20260105155420_add_user_theme_preference

ALTER TABLE users
ADD COLUMN theme VARCHAR(10) DEFAULT 'system' NOT NULL
  CHECK (theme IN ('light', 'dark', 'system'));

-- Add index for performance (theme filtering queries)
CREATE INDEX idx_users_theme ON users(theme);

-- Add updated_at timestamp for appearance changes
ALTER TABLE users
ADD COLUMN theme_updated_at TIMESTAMP DEFAULT NOW();
