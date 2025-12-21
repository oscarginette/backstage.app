-- Migration: Add Email Tracking Fields
-- Ejecutar DESPUÉS de migration-contacts.sql

-- Añadir campos de tracking a email_logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS clicked_urls JSONB DEFAULT '[]'::jsonb;

-- Índices para mejorar performance de queries de analytics
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_opened_at ON email_logs(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_clicked_at ON email_logs(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_email_id ON email_logs(resend_email_id);

-- Vista para estadísticas de campaña por track
CREATE OR REPLACE VIEW campaign_stats AS
SELECT
  st.track_id,
  st.title as track_title,
  st.url as track_url,
  st.published_at,
  COUNT(el.id) as total_sent,
  COUNT(el.id) FILTER (WHERE el.status = 'delivered' OR el.status = 'opened' OR el.status = 'clicked') as delivered,
  COUNT(el.id) FILTER (WHERE el.status = 'opened' OR el.status = 'clicked') as opened,
  COUNT(el.id) FILTER (WHERE el.status = 'clicked') as clicked,
  COUNT(el.id) FILTER (WHERE el.status = 'bounced') as bounced,
  COUNT(el.id) FILTER (WHERE el.status = 'failed') as failed,

  -- Rates (porcentajes)
  ROUND(
    (COUNT(el.id) FILTER (WHERE el.status = 'delivered' OR el.status = 'opened' OR el.status = 'clicked')::numeric /
    NULLIF(COUNT(el.id), 0) * 100), 2
  ) as delivery_rate,

  ROUND(
    (COUNT(el.id) FILTER (WHERE el.status = 'opened' OR el.status = 'clicked')::numeric /
    NULLIF(COUNT(el.id) FILTER (WHERE el.status = 'delivered' OR el.status = 'opened' OR el.status = 'clicked'), 0) * 100), 2
  ) as open_rate,

  ROUND(
    (COUNT(el.id) FILTER (WHERE el.status = 'clicked')::numeric /
    NULLIF(COUNT(el.id) FILTER (WHERE el.status = 'delivered' OR el.status = 'opened' OR el.status = 'clicked'), 0) * 100), 2
  ) as click_rate,

  ROUND(
    (COUNT(el.id) FILTER (WHERE el.status = 'bounced')::numeric /
    NULLIF(COUNT(el.id), 0) * 100), 2
  ) as bounce_rate,

  MAX(el.sent_at) as last_sent_at
FROM soundcloud_tracks st
LEFT JOIN email_logs el ON st.track_id = el.track_id
WHERE el.id IS NOT NULL
GROUP BY st.track_id, st.title, st.url, st.published_at
ORDER BY MAX(el.sent_at) DESC;

-- Vista para ver contactos más activos (los que más abren/clickean)
CREATE OR REPLACE VIEW top_engaged_contacts AS
SELECT
  c.id,
  c.email,
  c.name,
  COUNT(el.id) as emails_received,
  SUM(el.open_count) as total_opens,
  SUM(el.click_count) as total_clicks,
  COUNT(el.id) FILTER (WHERE el.status = 'opened' OR el.status = 'clicked') as emails_opened,
  ROUND(
    (COUNT(el.id) FILTER (WHERE el.status = 'opened' OR el.status = 'clicked')::numeric /
    NULLIF(COUNT(el.id), 0) * 100), 2
  ) as engagement_rate
FROM contacts c
LEFT JOIN email_logs el ON c.id = el.contact_id
WHERE c.subscribed = true AND el.id IS NOT NULL
GROUP BY c.id, c.email, c.name
HAVING COUNT(el.id) > 0
ORDER BY engagement_rate DESC, total_opens DESC
LIMIT 100;
