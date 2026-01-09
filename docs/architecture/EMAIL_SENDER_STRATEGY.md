# 📧 Email Sender Strategy - Backstage

## 🎯 Objetivo

Permitir que cada DJ envíe emails **desde su propia identidad**, igual que Mailchimp/Brevo, con una migración suave de Resend → SendGrid.

---

## 📋 Estrategia por Fases

### **Fase 1: Early Users / Amigos (Subdominios)**

**Objetivo:** MVP rápido sin onboarding DNS.

#### **Configuración:**
```typescript
// Cada DJ obtiene un subdominio automático
DJ 1 → u1.mail.thebackstage.app
DJ 2 → u2.mail.thebackstage.app
DJ 3 → u3.mail.thebackstage.app

// Email FROM:
from: 'DJ Name <newsletter@u1.mail.thebackstage.app>'
replyTo: 'dj@personal.com'  // Email personal del DJ
```

#### **Ventajas:**
- ✅ Setup instantáneo (sin DNS del usuario)
- ✅ Reputación aislada por DJ
- ✅ Email profesional para cada artista
- ✅ Barato / gratis

#### **Limitaciones:**
- ⚠️ Dominio es `@mail.thebackstage.app` (no dominio propio)
- ⚠️ No tan personalizado como `@djdomain.com`

#### **Provider:**
Usar **Resend** en Fase 1:
- Gratis hasta 3,000 emails/mes
- DX excelente
- Ya configurado en thebackstage.app

---

### **Fase 2: Primeros Ingresos (Dominios Propios)**

**Objetivo:** Feature premium para usuarios pagos.

#### **Configuración:**
```typescript
// DJ verifica su propio dominio
DJ verifica: djdomain.com

// DNS records (DJ los configura):
TXT @ "v=spf1 include:sendgrid.net ~all"
TXT sendgrid._domainkey "k=rsa; p=MIGfMA..."
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@djdomain.com"

// Email FROM (después de verificación):
from: 'DJ Name <newsletter@djdomain.com>'
```

#### **Ventajas:**
- ✅ FROM real: `@djdomain.com`
- ✅ Máxima personalización
- ✅ Profesional al 100%
- ✅ Feature premium (monetizable)

#### **Requisitos:**
- Usuario debe tener dominio propio
- Usuario debe saber configurar DNS (o UI guiada)
- Plan PRO/BUSINESS

#### **Provider:**
Migrar a **SendGrid** en Fase 2:
- API de Domain Authentication
- Gestión multi-tenant de dominios
- DKIM/SPF por dominio
- Escalable

---

## 🏗️ Arquitectura Implementada

### **1. Tabla: `sender_identities`**

```sql
CREATE TABLE sender_identities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Identity configuration
  sender_type sender_type NOT NULL DEFAULT 'subdomain',
    -- 'subdomain' | 'custom_domain' | 'shared'
  provider sender_provider NOT NULL DEFAULT 'resend',
    -- 'resend' | 'sendgrid' | 'smtp'

  -- Email headers
  from_email VARCHAR(255) NOT NULL,  -- newsletter@u1.mail.thebackstage.app
  from_name VARCHAR(255) NOT NULL,   -- "DJ TechnoKing"
  reply_to_email VARCHAR(255),       -- dj@gmail.com (personal email)

  -- Domain info
  domain VARCHAR(255) NOT NULL,      -- u1.mail.thebackstage.app
  subdomain VARCHAR(100),            -- "newsletter" (for custom domains)

  -- Authentication status
  auth_status domain_auth_status NOT NULL DEFAULT 'none',
    -- 'pending' | 'verified' | 'failed' | 'none'
  spf_verified BOOLEAN DEFAULT FALSE,
  dkim_verified BOOLEAN DEFAULT FALSE,
  dmarc_verified BOOLEAN DEFAULT FALSE,

  -- DNS records (for custom domains)
  dns_records JSONB,

  -- Provider config (SendGrid domain ID, etc.)
  provider_config JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,  -- User's default identity

  -- Timestamps
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Ejemplos de Registros:**

**Fase 1 - Subdomain:**
```json
{
  "id": 1,
  "user_id": 123,
  "sender_type": "subdomain",
  "provider": "resend",
  "from_email": "newsletter@u123.mail.thebackstage.app",
  "from_name": "DJ TechnoKing",
  "reply_to_email": "technoking@gmail.com",
  "domain": "u123.mail.thebackstage.app",
  "auth_status": "verified",
  "spf_verified": true,
  "dkim_verified": true,
  "dmarc_verified": true,
  "is_active": true,
  "is_primary": true
}
```

**Fase 2 - Custom Domain:**
```json
{
  "id": 2,
  "user_id": 123,
  "sender_type": "custom_domain",
  "provider": "sendgrid",
  "from_email": "newsletter@djdomain.com",
  "from_name": "DJ TechnoKing",
  "domain": "djdomain.com",
  "subdomain": "newsletter",
  "auth_status": "verified",
  "spf_verified": true,
  "dkim_verified": true,
  "dmarc_verified": true,
  "dns_records": {
    "spf": "v=spf1 include:sendgrid.net ~all",
    "dkim": "k=rsa; p=MIGfMA0GCSqGSIb3...",
    "dmarc": "v=DMARC1; p=none"
  },
  "provider_config": {
    "sendgridDomainId": 12345
  },
  "is_active": true,
  "is_primary": true
}
```

---

### **2. Domain Entity: `SenderIdentity.ts`**

```typescript
// domain/entities/SenderIdentity.ts
export class SenderIdentity {
  // Business logic methods

  canSendEmails(): boolean {
    // Subdomain → always ready
    // Custom → must be verified
  }

  getFromAddress(): string {
    // Returns: "DJ Name <email@domain.com>"
  }

  isBackstageSubdomain(): boolean {
    // Check if managed subdomain
  }

  canUpgradeToCustomDomain(): boolean {
    // Check if upgrade is available
  }

  // Factory methods
  static createSubdomainIdentity(userId, username, displayName)
  static createCustomDomainIdentity(userId, domain, displayName)
}
```

---

### **3. Naming Strategy de Subdominios**

#### **Formato:**
```
u{userId}.mail.thebackstage.app
```

#### **Ejemplos:**
```
User ID 1  → u1.mail.thebackstage.app
User ID 42 → u42.mail.thebackstage.app
User ID 999 → u999.mail.thebackstage.app
```

#### **¿Por qué ID y no username?**
- ✅ Único (PK de users)
- ✅ Inmutable (no cambia si user cambia username)
- ✅ Más corto
- ⚠️ Menos branding (pero es temporal hasta custom domain)

#### **Email completo:**
```
newsletter@u{userId}.mail.thebackstage.app
```

---

## 🔄 Migración Sin Dolor

### **Usuario migra de Subdomain → Custom Domain**

```typescript
// Paso 1: Usuario tiene subdomain (Fase 1)
{
  sender_type: 'subdomain',
  from_email: 'newsletter@u123.mail.thebackstage.app',
  provider: 'resend',
  is_primary: true
}

// Paso 2: Usuario upgradea a plan PRO
// - UI: "Usa tu dominio propio"
// - Usuario añade: djdomain.com
// - Backend crea nueva identity (pending)
{
  sender_type: 'custom_domain',
  from_email: 'newsletter@djdomain.com',
  provider: 'sendgrid',
  auth_status: 'pending',  // ← Pending verification
  is_primary: false
}

// Paso 3: Usuario configura DNS
// - UI muestra registros DNS
// - Usuario añade en su DNS provider

// Paso 4: Backend verifica DNS
// - Cron job checks DNS records
// - Actualiza auth_status: 'verified'

// Paso 5: Activación automática
// - Backend marca custom domain como is_primary
// - Subdomain queda como backup (is_primary: false)
{
  sender_type: 'custom_domain',
  auth_status: 'verified',  // ✅ Verified!
  is_primary: true          // ✅ Now primary!
}
```

**Resultado:**
- ✅ Emails ahora salen desde `@djdomain.com`
- ✅ Subdomain queda como fallback
- ✅ Cero downtime
- ✅ Historial preservado

---

## 📊 Comparación de Providers

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Free Tier** | 3,000 emails/mes | 100 emails/día |
| **DX** | 🟢 Excelente | 🟡 Buena |
| **Multi-tenant Domains** | ❌ No (solo Enterprise) | ✅ Sí (API pública) |
| **Domain Authentication API** | ❌ No | ✅ Sí |
| **Gestión de subdominios** | ✅ Sí | ✅ Sí |
| **Pricing** | $20/mes (50k emails) | $19.95/mes (50k emails) |
| **Reputación** | 🟢 Excelente | 🟢 Excelente |

### **Decisión:**
- **Fase 1:** Resend (ya configurado, simple, gratis)
- **Fase 2:** SendGrid (Domain Authentication API)

---

## 🚀 Roadmap de Implementación

### ✅ **COMPLETADO**

1. ✅ Arquitectura de `SenderIdentity` entity
2. ✅ Tabla `sender_identities` creada
3. ✅ Naming strategy definido (`u{id}.mail.thebackstage.app`)
4. ✅ Soporte `replyTo` en `IEmailProvider`
5. ✅ Migración SQL lista

### 🔄 **PENDIENTE** (Next Steps)

#### **Fase 1 - Subdominios (Early Users)**

1. **Backend:**
   - [ ] Crear `ISenderIdentityRepository`
   - [ ] Implementar `PostgresSenderIdentityRepository`
   - [ ] Crear `CreateSenderIdentityUseCase`
   - [ ] Actualizar `SendTrackEmailUseCase` para usar `SenderIdentity`
   - [ ] Hook: Auto-crear sender identity al signup

2. **Verificar Dominio en Resend:**
   - [ ] Verificar `*.mail.thebackstage.app` (wildcard) en Resend
   - [ ] O verificar subdominios individuales (u1, u2, u3...)

3. **Testing:**
   - [ ] Test email FROM: `newsletter@u1.mail.thebackstage.app`
   - [ ] Test Reply-To funciona
   - [ ] Test reputación aislada

#### **Fase 2 - Dominios Propios (Paid Users)**

4. **SendGrid Integration:**
   - [ ] Crear cuenta SendGrid
   - [ ] Implementar `SendGridEmailProvider`
   - [ ] Implementar `VerifyCustomDomainUseCase` (DNS check)
   - [ ] Cron job para verificar DNS pendientes

5. **UI:**
   - [ ] Página `/settings/domains`
   - [ ] UI para añadir dominio propio
   - [ ] UI para mostrar DNS records
   - [ ] UI para verificar status

6. **Feature Flag:**
   - [ ] Feature: `ENABLE_CUSTOM_DOMAINS`
   - [ ] Solo para planes PRO/BUSINESS

---

## 🎓 Copy para "Upgrade de Entregabilidad"

Cuando usuario upgradea de subdomain → custom domain:

```markdown
## 🚀 Mejora tu Entregabilidad con Dominio Propio

Actualmente envías desde:
**newsletter@u123.mail.thebackstage.app**

Con un dominio propio, tus emails saldrán desde:
**newsletter@tudominio.com**

### Beneficios:
- ✅ **Mayor confianza:** Emails desde tu marca, no de Backstage
- ✅ **Mejor deliverability:** Tu propia reputación DKIM/SPF
- ✅ **100% profesional:** Impresiona a tus fans

### Requisitos:
- Plan PRO o superior
- Dominio propio (ej: tudominio.com)
- 5 minutos para configurar DNS

[Configurar Mi Dominio →]
```

---

## 📝 Notas de Implementación

### **Separación de Responsabilidades**

```
Resend:
  - Emails transaccionales (password reset, notificaciones)
  - Emails internos de Backstage
  - Volumen bajo

SendGrid (Fase 2):
  - Newsletters de DJs
  - Campañas de marketing
  - Volumen alto
  - Multi-tenant
```

### **Gestión de Reputación**

**❌ MAL:**
```
Todos los DJs envían desde:
newsletter@thebackstage.app
```
→ Un DJ spammea → todos sufren

**✅ BIEN:**
```
DJ 1 → u1.mail.thebackstage.app
DJ 2 → u2.mail.thebackstage.app
DJ 3 → u3.mail.thebackstage.app
```
→ Reputación aislada

---

## 🔍 Monitoreo

### **Métricas por Sender Identity:**

```sql
-- Emails enviados por sender
SELECT
  si.from_email,
  si.sender_type,
  COUNT(*) AS emails_sent,
  COUNT(*) FILTER (WHERE delivered) AS delivered,
  COUNT(*) FILTER (WHERE bounced) AS bounced
FROM email_events ee
JOIN sender_identities si ON si.user_id = ee.user_id
GROUP BY si.from_email, si.sender_type;
```

### **Health Check:**

```sql
-- Identities pendientes de verificación
SELECT * FROM sender_identities
WHERE sender_type = 'custom_domain'
AND auth_status = 'pending'
AND created_at < NOW() - INTERVAL '7 days';
```

---

## 📚 Referencias

- **SendGrid Domain Authentication API:** https://docs.sendgrid.com/api-reference/domain-authentication
- **Resend Docs:** https://resend.com/docs
- **SPF/DKIM/DMARC Guía:** https://dmarcian.com/what-is-dmarc/

---

**Última actualización:** 2026-01-05
**Autor:** Claude + Usuario
**Estado:** ✅ Fase 1 arquitectura completa, lista para implementación
