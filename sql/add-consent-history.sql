-- Migration: Add Consent History (GDPR Compliance)
-- Tracks all consent-related actions with full audit trail

-- Tabla de historial de consentimiento
CREATE TABLE IF NOT EXISTS consent_history (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'subscribe', 'unsubscribe', 'resubscribe', 'delete_request', 'bounce', 'spam_complaint'
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'email_link', 'api_request', 'admin_action', 'webhook_bounce', 'hypedit_signup'
  ip_address INET, -- IP del usuario (si disponible)
  user_agent TEXT, -- User agent del browser
  metadata JSONB, -- Datos extras: {reason: "too_many_emails", campaign_id: "123", etc}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_consent_history_contact_id ON consent_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_action ON consent_history(action);
CREATE INDEX IF NOT EXISTS idx_consent_history_timestamp ON consent_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_history_source ON consent_history(source);

-- Vista para estadísticas de consent
CREATE OR REPLACE VIEW consent_stats AS
SELECT
  action,
  source,
  COUNT(*) as count,
  DATE_TRUNC('day', timestamp) as date
FROM consent_history
GROUP BY action, source, DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Vista para churn analysis
CREATE OR REPLACE VIEW unsubscribe_analysis AS
SELECT
  ch.contact_id,
  c.email,
  ch.timestamp as unsubscribed_at,
  ch.source,
  ch.metadata->>'reason' as reason,
  -- Calcular días desde signup hasta unsubscribe
  EXTRACT(DAY FROM ch.timestamp - c.created_at) as days_subscribed,
  -- Cuántos emails recibió antes de unsubscribe
  (SELECT COUNT(*) FROM email_logs el WHERE el.contact_id = ch.contact_id AND el.sent_at < ch.timestamp) as emails_received
FROM consent_history ch
JOIN contacts c ON c.id = ch.contact_id
WHERE ch.action = 'unsubscribe'
ORDER BY ch.timestamp DESC;

-- Comentarios para documentación
COMMENT ON TABLE consent_history IS 'GDPR Article 30 - Records of processing activities';
COMMENT ON COLUMN consent_history.action IS 'Type of consent action';
COMMENT ON COLUMN consent_history.source IS 'Where the action originated from';
COMMENT ON COLUMN consent_history.ip_address IS 'User IP for verification (GDPR legal basis)';
COMMENT ON COLUMN consent_history.metadata IS 'Additional context (reason, campaign_id, etc)';
