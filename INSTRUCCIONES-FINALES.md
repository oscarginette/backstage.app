# 🎯 INSTRUCCIONES FINALES - Sistema Actualizado

## ✅ Cambios Implementados

### 1. **Horario del Cron**
- ❌ Antes: Cada 30 minutos
- ✅ Ahora: **1 vez al día a las 20:00 (hora de España)**

### 2. **Destinatarios**
- ❌ Antes: Lista hardcodeada de emails
- ✅ Ahora: **Listas de contactos de Brevo** (dinámico)

### 3. **Interfaz de Usuario**
- ✅ **Dashboard creado** en `/dashboard`
- ✅ Selección de listas de Brevo
- ✅ Botón de test manual
- ✅ Visualización de configuración

---

## 📝 PASOS PARA ACTIVAR EL SISTEMA

### PASO 1: Ejecutar SQL Actualizado (2 min)

El SQL ha sido actualizado para incluir una nueva tabla de configuración.

1. Ve a **Vercel** → Tu proyecto → **Storage** → **Postgres** → **Query**
2. **Copia TODO el archivo** `sql/setup.sql` (actualizado)
3. Ejecuta el SQL completo
4. Verifica que se crearon **3 tablas**:
   - `soundcloud_tracks`
   - `execution_logs`
   - `app_config` ← **NUEVA**

---

### PASO 2: Configurar Variables de Entorno en Vercel (3 min)

Ve a **Vercel** → Settings → Environment Variables

**Variables necesarias** (5 en total):

| Variable | Valor | Nota |
|----------|-------|------|
| `BREVO_API_KEY` | `[Tu API key de Brevo]` | La que te proporcioné |
| `BREVO_TEMPLATE_ID` | `[ID del template]` | Extraer del link |
| `SENDER_EMAIL` | `info@geebeat.com` | Email verificado |
| `SOUNDCLOUD_USER_ID` | `1318247880` | Ya obtenido |
| `POSTGRES_URL` | `[auto-generado]` | De Vercel Postgres |

**⚠️ IMPORTANTE**: Ya NO necesitas `RECIPIENT_EMAILS` (ahora se usa el dashboard)

---

### PASO 3: Extraer Template ID de Brevo (1 min)

Tu link: `https://my.brevo.com/template/Z_SUWuk0oHgDB8fNrGcoQDIEJHEeRCxirr7hiKDOQweqAi3Uor5yMkCDvg`

**Método 1 - Desde el dashboard de Brevo:**
1. Ve a **Campaigns** → **Transactional** → **Templates**
2. Busca tu template "Nueva Canción SoundCloud" (o similar)
3. El **Template ID** aparece como número en la lista

**Método 2 - Desde la API:**
```bash
# Obtener todos tus templates
curl -X GET "https://api.brevo.com/v3/smtp/templates" \
  -H "api-key: [TU_API_KEY]"
```

**Dame el Template ID:**
```
BREVO_TEMPLATE_ID = _________
```

---

### PASO 4: Deploy (Automático)

Una vez configures las variables en Vercel, el deploy se hace **automáticamente**.

1. Ve a **Deployments** en Vercel
2. Espera a que esté "Ready" (1-2 min)

---

### PASO 5: Configurar Listas en el Dashboard (5 min)

1. **Abre el dashboard**: `https://[tu-proyecto].vercel.app/dashboard`
2. Verás todas tus **listas de contactos de Brevo**
3. **Selecciona las listas** a las que quieres enviar
4. Click **"Guardar Configuración"**
5. (Opcional) Click **"🚀 Probar Ahora"** para test manual

**Resultado esperado:**
- Si hay track nuevo: Enviará email a TODAS las listas seleccionadas
- Si no hay track nuevo: Mensaje "No hay nuevos tracks"

---

## 🔍 Verificación

### A. Verificar Cron Job:

Ve a **Vercel** → **Settings** → **Cron Jobs**

Debe mostrar:
- **Path**: `/api/check-soundcloud`
- **Schedule**: `0 19 * * *` (19:00 UTC = 20:00 España)

### B. Verificar Configuración Guardada:

En Vercel Postgres → Query:

```sql
SELECT * FROM app_config;
```

Debe mostrar tu configuración con las listas seleccionadas.

### C. Test Manual:

Desde el dashboard, click en **"🚀 Probar Ahora"**

**Resultado esperado:**
- Mensaje de éxito
- Email recibido en las listas configuradas

---

## 📊 Cómo Funciona el Sistema (Actualizado)

```
┌─────────────────────────────────────────────────────────┐
│  VERCEL CRON (20:00 España, diario)                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  /api/check-soundcloud                                   │
│  ├─ 1. Fetch RSS SoundCloud                            │
│  ├─ 2. Get último track                                │
│  ├─ 3. ¿Existe en DB?                                  │
│  │    ├─ SÍ → Return "No new tracks"                   │
│  │    └─ NO → Continuar                                │
│  ├─ 4. Leer config de app_config (listas de Brevo)    │
│  ├─ 5. Enviar email a TODAS las listas configuradas   │
│  ├─ 6. Guardar track en DB                             │
│  └─ 7. Log ejecución                                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  CONTACTOS EN BREVO RECIBEN EMAIL 📧                    │
│  (Todas las listas que seleccionaste)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎛️ Dashboard Features

### Funcionalidades:
- ✅ Ver todas las listas de contactos de Brevo
- ✅ Seleccionar múltiples listas
- ✅ Guardar configuración en DB
- ✅ Test manual del sistema
- ✅ Ver información del sistema

### URL:
```
https://[tu-proyecto].vercel.app/dashboard
```

---

## 🆕 Nuevas APIs Creadas

### 1. `GET /api/brevo-lists`
Obtiene todas las listas de contactos de Brevo.

**Respuesta:**
```json
{
  "lists": [
    {
      "id": 123,
      "name": "Newsletter Principal",
      "totalSubscribers": 500
    },
    {
      "id": 456,
      "name": "VIP Fans",
      "totalSubscribers": 50
    }
  ]
}
```

### 2. `GET /api/config`
Obtiene la configuración actual (listas seleccionadas).

**Respuesta:**
```json
{
  "listIds": [123, 456]
}
```

### 3. `POST /api/config`
Guarda la configuración de listas.

**Body:**
```json
{
  "listIds": [123, 456]
}
```

---

## 🔐 Seguridad

- ✅ API key NO está en código
- ✅ Configuración en base de datos (no hardcoded)
- ✅ Dashboard protegido (puedes añadir auth después)

---

## 📞 Lo que NECESITO de ti:

1. ✅ **Ejecutar SQL actualizado** (`sql/setup.sql` completo)
2. ✅ **Configurar 5 variables** en Vercel
3. ✅ **Dame el Template ID** de Brevo
4. ✅ **Esperar deploy** automático
5. ✅ **Ir al dashboard** y seleccionar listas

---

## 🚀 Después de Configurar

El sistema funcionará **completamente automático**:

1. **Cada día a las 20:00** (España)
2. Revisa si hay un track nuevo en SoundCloud
3. Si hay uno → Envía a TODAS las listas de Brevo que seleccionaste
4. **Sin intervención manual nunca más** 🎉

---

## ❓ FAQ

### ¿Puedo cambiar las listas después?
Sí, solo ve al dashboard, cambia la selección y guarda.

### ¿Puedo hacer test sin esperar a las 20:00?
Sí, usa el botón "🚀 Probar Ahora" en el dashboard.

### ¿Cómo cambio el horario del cron?
Edita `vercel.json` → `schedule`:
- `0 19 * * *` = 20:00 España (19:00 UTC)
- Calculadora: https://crontab.guru

### ¿Qué pasa si no hay listas configuradas?
El cron fallará con error "No Brevo lists configured". Debes configurar al menos 1 lista.

---

## 📊 Monitoreo

### Ver logs en tiempo real:
**Vercel** → **Functions** → `check-soundcloud` → **Logs**

### Ver stats en DB:
```sql
-- Último track enviado
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC LIMIT 1;

-- Últimas ejecuciones
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 10;

-- Configuración actual
SELECT * FROM app_config;
```

---

**¿Todo claro?** Dame el **Template ID** de Brevo cuando lo tengas y verifico que todo funcione! 🚀
