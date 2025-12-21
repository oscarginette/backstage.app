-- Migration: Add Contacts and Subscriptions System
-- Ejecutar en Neon/Vercel Postgres para reemplazar Brevo

-- Tabla de contactos/suscriptores
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  source VARCHAR(100) DEFAULT 'hypedit', -- hypedit, manual, import, etc.
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE, -- Token único para unsubscribe seguro
  metadata JSONB -- Para guardar datos extras de Hypedit (país, canción descargada, etc.)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_subscribed ON contacts(subscribed);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_unsubscribe_token ON contacts(unsubscribe_token);

-- Tabla de historial de emails enviados (para tracking)
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  track_id VARCHAR(500) REFERENCES soundcloud_tracks(track_id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resend_email_id VARCHAR(255), -- ID del email en Resend
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, failed
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_track_id ON email_logs(track_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Habilitar extensión pgcrypto para gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para generar token de unsubscribe
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token := encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar token al crear contacto
DROP TRIGGER IF EXISTS set_unsubscribe_token ON contacts;
CREATE TRIGGER set_unsubscribe_token
  BEFORE INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION generate_unsubscribe_token();

-- Vista para estadísticas
CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  COUNT(*) FILTER (WHERE subscribed = true) as active_subscribers,
  COUNT(*) FILTER (WHERE subscribed = false) as unsubscribed,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE source = 'hypedit') as from_hypedit,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days
FROM contacts;

-- Remover la dependencia de Brevo en app_config
ALTER TABLE app_config DROP COLUMN IF EXISTS brevo_list_ids;
