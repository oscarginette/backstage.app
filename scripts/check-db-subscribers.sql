-- Verificar los últimos 10 suscriptores
SELECT
  id,
  email,
  name,
  source,
  subscribed,
  created_at,
  metadata
FROM contacts
ORDER BY created_at DESC
LIMIT 10;

-- Estadísticas generales
SELECT
  COUNT(*) FILTER (WHERE subscribed = true) as suscriptores_activos,
  COUNT(*) FILTER (WHERE subscribed = false) as desuscritos,
  COUNT(*) as total_contactos,
  COUNT(*) FILTER (WHERE source = 'hypedit') as desde_hypedit,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as ultimas_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as ultimos_7_dias
FROM contacts;

-- Contactos de hoy
SELECT
  email,
  name,
  source,
  created_at
FROM contacts
WHERE created_at > CURRENT_DATE
ORDER BY created_at DESC;
