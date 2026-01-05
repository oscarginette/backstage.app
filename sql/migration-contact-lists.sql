-- Migration: Contact Lists Feature
-- Created: 2026-01-05
-- Description: Add custom contact lists functionality for audience segmentation

-- Tabla principal de listas de contactos
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6366F1', -- Hex color
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_list_name_per_user UNIQUE (user_id, name)
);

-- Tabla de relación many-to-many entre listas y contactos
CREATE TABLE IF NOT EXISTS contact_list_members (
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  PRIMARY KEY (list_id, contact_id)
);

-- Índices para optimización de rendimiento
CREATE INDEX IF NOT EXISTS idx_contact_lists_user_id ON contact_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_name ON contact_lists(user_id, LOWER(name)); -- Búsqueda case-insensitive
CREATE INDEX IF NOT EXISTS idx_contact_lists_created ON contact_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON contact_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_contact_id ON contact_list_members(contact_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contact_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_lists_timestamp
BEFORE UPDATE ON contact_lists
FOR EACH ROW
EXECUTE FUNCTION update_contact_lists_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE contact_lists IS 'User-defined custom lists for contact organization and email segmentation';
COMMENT ON TABLE contact_list_members IS 'Junction table for many-to-many relationship between lists and contacts';
COMMENT ON COLUMN contact_lists.color IS 'Hex color code for UI display (e.g., #6366F1)';
COMMENT ON COLUMN contact_lists.metadata IS 'Flexible JSONB field for future extensions';
COMMENT ON COLUMN contact_list_members.added_by IS 'User ID who added the contact to the list';
