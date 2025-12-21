# Migración de Contactos: Brevo → Neon

Este documento explica cómo migrar todos tus contactos desde Brevo a tu base de datos PostgreSQL en Neon.

## 📋 Prerequisitos

1. ✅ Tener una cuenta activa en Brevo con contactos
2. ✅ API Key de Brevo configurada en `.env.local`:
   ```
   BREVO_API_KEY=xkeysib-...
   ```
3. ✅ Base de datos Neon configurada con las tablas necesarias
4. ✅ Variable `POSTGRES_URL` configurada en `.env.local`

## 🗄️ Estructura de la Base de Datos

La migración usa la tabla `contacts` creada con este schema:

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  source VARCHAR(100) DEFAULT 'hypedit',
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  unsubscribe_token VARCHAR(64) UNIQUE,
  metadata JSONB
);
```

Ver archivo completo: `sql/migration-contacts.sql`

## 🚀 Cómo Ejecutar la Migración

### Opción 1: Usando el CLI (Recomendado)

```bash
npm run migrate-contacts
```

El script:
1. Muestra el estado actual de la base de datos
2. Pide confirmación antes de ejecutar
3. Migra todos los contactos de Brevo
4. Muestra un reporte detallado

### Opción 2: Usando la API directamente

1. **Verificar estado actual** (sin ejecutar la migración):
   ```bash
   curl http://localhost:3002/api/migrate-contacts
   ```

2. **Ejecutar la migración**:
   ```bash
   curl -X POST http://localhost:3002/api/migrate-contacts
   ```

## 🔄 Proceso de Migración

El script automáticamente:

1. **Obtiene todas las listas de Brevo**
   - Procesa cada lista de contactos

2. **Extrae información de cada contacto**:
   - Email
   - Nombre (combinando FIRSTNAME y LASTNAME si existen)
   - Estado de suscripción
   - Atributos personalizados
   - IDs de listas a las que pertenece

3. **Inserta en Neon**:
   - Si el email **NO existe**: crea nuevo contacto
   - Si el email **YA existe**: actualiza información
   - Maneja duplicados automáticamente (no falla)

4. **Metadata guardada**:
   ```json
   {
     "brevo_id": 123456,
     "brevo_list_ids": [5, 12, 18],
     "attributes": {
       "FIRSTNAME": "Juan",
       "LASTNAME": "Pérez",
       "COUNTRY": "ES"
     },
     "imported_from_brevo": true,
     "imported_at": "2025-12-21T10:30:00Z"
   }
   ```

## 📊 Reporte de Resultados

Al finalizar verás algo como:

```
✅ MIGRACIÓN COMPLETADA

═══════════════════════════════════════
📥 MIGRACIÓN:
  • Contactos obtenidos de Brevo: 1250
  • Nuevos contactos insertados: 1200
  • Contactos actualizados: 50
  • Contactos con errores: 0
  • Listas procesadas: 3
  • Duración: 45.23s

💾 BASE DE DATOS NEON:
  • Total de contactos: 1250
  • Suscritos activos: 1180
  • No suscritos: 70
  • Migrados desde Brevo: 1250
═══════════════════════════════════════
```

## ⚠️ Consideraciones Importantes

### Duplicados
- Los contactos se identifican por **email único**
- Si un email ya existe, se actualiza la información
- No se crean duplicados

### Estado de Suscripción
- Si en Brevo un contacto está en "blacklist" → se marca como `subscribed = false`
- Si está activo en Brevo → se marca como `subscribed = true`

### Paginación
- Brevo tiene límite de 500 contactos por página
- El script maneja automáticamente la paginación
- Procesa TODAS las páginas hasta obtener todos los contactos

### Throttling
- Hay una pausa de 100ms entre cada página
- Esto previene saturar la API de Brevo
- La migración puede tardar varios minutos si tienes muchos contactos

### Timeout
- El endpoint tiene un timeout de 60 segundos configurado
- Si tienes MUCHOS contactos (>10,000), considera:
  1. Ejecutar en producción (Vercel tiene mejor timeout)
  2. O ejecutar el script varias veces filtrando por listas

## 🔍 Verificar la Migración

Después de migrar, puedes verificar en la base de datos:

```sql
-- Ver estadísticas
SELECT
  COUNT(*) FILTER (WHERE subscribed = true) as activos,
  COUNT(*) FILTER (WHERE subscribed = false) as no_suscritos,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE source = 'brevo_migration') as desde_brevo
FROM contacts;

-- Ver últimos contactos migrados
SELECT email, name, subscribed, created_at
FROM contacts
WHERE source = 'brevo_migration'
ORDER BY created_at DESC
LIMIT 10;

-- Ver metadata de un contacto específico
SELECT email, metadata
FROM contacts
WHERE email = 'ejemplo@email.com';
```

## 🎯 Próximos Pasos

Después de la migración:

1. ✅ Los emails ya se envían desde Neon (ver `app/api/send-track/route.ts`)
2. ✅ Los nuevos contactos de Hypedit se guardan directamente en Neon
3. ✅ Ya no necesitas usar Brevo para almacenar contactos
4. ⚠️ Si quieres, puedes mantener Brevo solo como backup
5. 🗑️ O eliminar contactos de Brevo una vez verificado todo

## ❓ Troubleshooting

### Error: "BREVO_API_KEY not configured"
- Verifica que tu `.env.local` tenga la API key
- Reinicia el servidor de desarrollo

### Error: "Failed to fetch Brevo lists"
- Verifica que tu API key tenga permisos de lectura
- Algunas API keys de Brevo (MCP) tienen permisos limitados

### La migración es muy lenta
- Normal si tienes muchos contactos
- La paginación y throttling toman tiempo
- Considera ejecutar en horarios de poco tráfico

### Algunos contactos no se migraron
- Revisa el array `errors` en el reporte
- Usualmente es por emails inválidos o malformados
- Los errores se muestran en consola

## 📝 Archivos Relacionados

- `app/api/migrate-contacts/route.ts` - API endpoint de migración
- `scripts/migrate-brevo-contacts.ts` - Script CLI
- `sql/migration-contacts.sql` - Schema de la tabla contacts
- `app/api/send-track/route.ts` - Envío de emails usando Neon
