# Plan de Integración de Mailgun

**Fecha**: 2026-01-05
**Objetivo**: Migrar de Resend a Mailgun como proveedor de email
**Estimación**: 6-8 horas de desarrollo
**Riesgo**: Bajo (arquitectura Clean permite cambio de provider sin afectar lógica de negocio)

---

## 📋 Contexto

### ¿Por qué Mailgun?

**Ventajas sobre Resend/SES:**
- ✅ **Suppression lists multi-tenant built-in** (crítico para multi-DJ)
- ✅ **Webhooks robustos** con retry logic automático
- ✅ **Email validation API** (reduce bounces preventivamente)
- ✅ **Analytics detallados** por campaign, tag, dominio
- ✅ **DKIM/SPF setup automático**
- ✅ **Maduro** (desde 2010) vs Resend (2023)
- ✅ **Mejor coste/valor** para 100k-500k emails/mes

**Coste estimado:**
- 10k emails/mes: ~$8 (vs $10 Resend)
- 100k emails/mes: ~$80 (vs ~$80 Resend)
- Break-even: Similar, pero Mailgun ofrece más features

### Arquitectura actual (Clean Architecture ✅)

```
domain/providers/IEmailProvider.ts       → Interface (DIP)
infrastructure/email/ResendEmailProvider.ts  → Implementación actual
infrastructure/email/MailgunEmailProvider.ts → Nueva implementación
lib/di-container.ts                       → Factory (inyecta provider)
```

**Ventaja clave**: Cambiar provider es implementar `IEmailProvider` + actualizar factory. CERO cambios en use cases.

---

## 🎯 Objetivos del plan

1. **Implementar MailgunEmailProvider** que cumpla interfaz `IEmailProvider`
2. **Configurar webhooks de Mailgun** para eventos de email
3. **Actualizar variables de entorno** con credenciales de Mailgun
4. **Migrar de tags de Resend a tags de Mailgun** (formato diferente)
5. **Testing exhaustivo** en sandbox antes de producción
6. **Documentar proceso de setup** para dominios verificados

---

## 📊 Análisis de diferencias: Resend vs Mailgun

### 1. **Tags/Metadata**

**Resend:**
```typescript
tags: [{ name: 'campaign_id', value: 'abc123' }]
```

**Mailgun:**
```typescript
'o:tag': ['campaign_id:abc123', 'user_id:456']
// o variables: { campaign_id: 'abc123', user_id: '456' }
```

**Decisión**: Usar `o:tag` con formato `key:value` para compatibilidad.

### 2. **Headers (List-Unsubscribe)**

Ambos usan el mismo estándar RFC:
```typescript
headers: {
  'List-Unsubscribe': '<https://...>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
}
```

✅ Sin cambios necesarios.

### 3. **Webhook Events**

| Resend | Mailgun | Mapeo |
|--------|---------|-------|
| email.sent | accepted | ✅ |
| email.delivered | delivered | ✅ |
| email.opened | opened | ✅ |
| email.clicked | clicked | ✅ |
| email.bounced | failed (permanent) | ✅ |
| email.delivery_delayed | failed (temporary) | ⚠️ Separar |

**Acción**: Actualizar `EmailEventFactory` para mapear eventos de Mailgun.

### 4. **Webhook Signature Verification**

**Resend**: HMAC-SHA256 con timestamp
**Mailgun**: HMAC-SHA256 con timestamp + token

✅ Similar, crear `verifyMailgunWebhook()` siguiendo patrón de `verifyResendWebhook()`.

---

## 🏗️ Estructura de implementación

### Fase 1: Configuración de credenciales (30min)

**Archivos a modificar:**
- `.env.local` / `.env`
- `lib/env.ts`

**Nuevas variables:**
```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_verified_domain.mailgun.org
MAILGUN_API_URL=https://api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=<obtener de dashboard>

# Feature flag para migración gradual
USE_MAILGUN=true  # Switch para A/B testing
```

**Cambios en `lib/env.ts`:**
```typescript
const envSchema = z.object({
  // ... existing ...

  // Mailgun Configuration
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_API_URL: z.string().url().default('https://api.mailgun.net'),
  MAILGUN_WEBHOOK_SIGNING_KEY: z.string().optional(),
  USE_MAILGUN: z.string().transform(val => val === 'true').default('false'),
});
```

---

### Fase 2: Implementar MailgunEmailProvider (2-3h)

**Archivo**: `infrastructure/email/MailgunEmailProvider.ts`

**Dependencias:**
```bash
npm install mailgun.js form-data
npm install --save-dev @types/mailgun.js
```

**Implementación:**

```typescript
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { IEmailProvider, EmailParams, EmailResult } from './IEmailProvider';

export class MailgunEmailProvider implements IEmailProvider {
  private mg: any;
  private domain: string;

  constructor(apiKey: string, domain: string, apiUrl?: string) {
    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: apiUrl || 'https://api.mailgun.net'
    });
    this.domain = domain;
  }

  async send(params: EmailParams): Promise<EmailResult> {
    try {
      // 1. Build message data
      const messageData: any = {
        from: params.from || `The Backstage <noreply@${this.domain}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      };

      // 2. Add Reply-To if specified
      if (params.replyTo) {
        messageData['h:Reply-To'] = params.replyTo;
      }

      // 3. Add List-Unsubscribe headers (CAN-SPAM compliance)
      if (params.unsubscribeUrl) {
        messageData['h:List-Unsubscribe'] = `<${params.unsubscribeUrl}>`;
        messageData['h:List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }

      // 4. Convert tags from Resend format to Mailgun format
      // Resend: [{ name: 'campaign_id', value: 'abc' }]
      // Mailgun: 'o:tag': ['campaign_id:abc']
      if (params.tags && params.tags.length > 0) {
        messageData['o:tag'] = params.tags.map(
          tag => `${tag.name}:${tag.value}`
        );
      }

      // 5. Add custom headers
      if (params.headers) {
        for (const [key, value] of Object.entries(params.headers)) {
          messageData[`h:${key}`] = value;
        }
      }

      console.log('[MailgunEmailProvider] Sending email:', {
        to: params.to,
        subject: params.subject,
        from: messageData.from,
        replyTo: messageData['h:Reply-To'],
        hasUnsubscribe: !!params.unsubscribeUrl,
        tags: messageData['o:tag'],
        htmlLength: params.html?.length || 0,
      });

      // 6. Send via Mailgun API
      const response = await this.mg.messages.create(this.domain, messageData);

      console.log('[MailgunEmailProvider] Email sent successfully:', {
        to: params.to,
        messageId: response.id,
      });

      return {
        success: true,
        id: response.id,
        messageId: response.id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to send email via Mailgun';

      console.error('[MailgunEmailProvider] Error:', {
        to: params.to,
        error,
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
```

**Características clave:**
- ✅ Implementa `IEmailProvider` (DIP)
- ✅ Convierte tags de formato Resend a Mailgun
- ✅ Maneja List-Unsubscribe headers (CAN-SPAM)
- ✅ Logging detallado para debugging
- ✅ Error handling robusto

---

### Fase 3: Actualizar DI Container (30min)

**Archivo**: `lib/di-container.ts`

**Cambios en ProviderFactory:**

```typescript
import { ResendEmailProvider } from '@/infrastructure/email/ResendEmailProvider';
import { MailgunEmailProvider } from '@/infrastructure/email/MailgunEmailProvider';
import { env, getRequiredEnv } from '@/lib/env';

export class ProviderFactory {
  static createEmailProvider(): IEmailProvider {
    // Feature flag para migración gradual
    if (env.USE_MAILGUN) {
      const apiKey = getRequiredEnv('MAILGUN_API_KEY');
      const domain = getRequiredEnv('MAILGUN_DOMAIN');
      const apiUrl = env.MAILGUN_API_URL || 'https://api.mailgun.net';

      console.log('[ProviderFactory] Using Mailgun email provider');
      return new MailgunEmailProvider(apiKey, domain, apiUrl);
    }

    // Fallback a Resend
    const resendApiKey = getRequiredEnv('RESEND_API_KEY');
    console.log('[ProviderFactory] Using Resend email provider');
    return new ResendEmailProvider(resendApiKey);
  }
}
```

**Ventaja**: Feature flag permite A/B testing y rollback instantáneo.

---

### Fase 4: Webhooks de Mailgun (2-3h)

#### 4.1. Crear endpoint webhook

**Archivo**: `app/api/webhooks/mailgun/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { verifyMailgunWebhook } from '@/lib/webhooks/verify-mailgun-signature';
import { ProcessEmailEventUseCase } from '@/domain/services/ProcessEmailEventUseCase';
import { EmailEventFactory } from '@/infrastructure/events/EmailEventFactory';
import { emailEventRepository } from '@/infrastructure/database/repositories';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Mailgun Webhook Endpoint
 *
 * Events: delivered, opened, clicked, failed, complained, unsubscribed
 *
 * Setup in Mailgun Dashboard:
 * 1. Settings → Webhooks
 * 2. Add webhook: https://thebackstage.app/api/webhooks/mailgun
 * 3. Select events: delivered, opened, clicked, failed (permanent/temporary), complained
 * 4. Copy signing key to MAILGUN_WEBHOOK_SIGNING_KEY
 */
export async function POST(request: Request) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-mailgun-signature');
    const timestamp = request.headers.get('x-mailgun-timestamp');
    const token = request.headers.get('x-mailgun-token');

    // 2. Verify webhook signature
    if (env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      if (!signature || !timestamp || !token) {
        console.error('[Mailgun Webhook] Missing signature headers');
        return NextResponse.json(
          { error: 'Missing signature headers' },
          { status: 401 }
        );
      }

      const isValid = verifyMailgunWebhook(
        timestamp,
        token,
        signature,
        env.MAILGUN_WEBHOOK_SIGNING_KEY
      );

      if (!isValid) {
        console.error('[Mailgun Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Mailgun Webhook] No signing key configured - skipping verification');
    }

    // 3. Parse webhook payload
    const body = JSON.parse(rawBody);
    const eventData = body['event-data'];

    if (!eventData) {
      return NextResponse.json(
        { error: 'Missing event-data' },
        { status: 400 }
      );
    }

    // 4. Map Mailgun event to internal format
    const mappedEvent = mapMailgunEvent(eventData);

    console.log('[Mailgun Webhook] Processing event:', {
      type: mappedEvent.type,
      messageId: mappedEvent.data.email_id,
    });

    // 5. Process event using existing use case
    const handlers = EmailEventFactory.createHandlers(emailEventRepository);
    const useCase = new ProcessEmailEventUseCase(emailEventRepository, handlers);

    await useCase.execute(mappedEvent.type, mappedEvent.data);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to process webhook';

    console.error('[Mailgun Webhook] Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Map Mailgun event format to internal format (compatible with Resend)
 */
function mapMailgunEvent(eventData: any): { type: string; data: any } {
  const event = eventData.event; // e.g., 'delivered', 'opened', 'clicked', 'failed'
  const messageId = eventData.message?.headers?.['message-id'];

  // Extract tags from Mailgun format
  // Mailgun: ['campaign_id:abc123', 'user_id:456']
  const tags = eventData.tags?.map((tag: string) => {
    const [name, value] = tag.split(':');
    return { name, value };
  }) || [];

  // Map to internal event format
  const typeMap: Record<string, string> = {
    'accepted': 'email.sent',
    'delivered': 'email.delivered',
    'opened': 'email.opened',
    'clicked': 'email.clicked',
    'failed': eventData['severity'] === 'permanent'
      ? 'email.bounced'
      : 'email.delivery_delayed',
    'complained': 'email.spam_complaint',
    'unsubscribed': 'email.unsubscribed',
  };

  return {
    type: typeMap[event] || event,
    data: {
      email_id: messageId,
      timestamp: eventData.timestamp,
      recipient: eventData.recipient,
      tags,
      // Bounce-specific data
      ...(event === 'failed' && {
        bounce_type: eventData.severity, // 'permanent' or 'temporary'
        reason: eventData.reason,
      }),
      // Click-specific data
      ...(event === 'clicked' && {
        link: eventData.url,
      }),
    },
  };
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/mailgun',
    events: ['delivered', 'opened', 'clicked', 'failed', 'complained'],
  });
}
```

#### 4.2. Implementar verificación de firma

**Archivo**: `lib/webhooks/verify-mailgun-signature.ts`

```typescript
import crypto from 'crypto';

/**
 * Verify Mailgun webhook signature
 *
 * Mailgun uses HMAC-SHA256 with timestamp + token
 *
 * @see https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks/#securing-webhooks
 */
export function verifyMailgunWebhook(
  timestamp: string,
  token: string,
  signature: string,
  signingKey: string
): boolean {
  try {
    // 1. Check timestamp to prevent replay attacks (max 15 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTime - timestampNum);

    if (timeDifference > 900) { // 15 minutes
      console.error('[Mailgun Webhook] Timestamp too old:', {
        timestamp: timestampNum,
        current: currentTime,
        difference: timeDifference,
      });
      return false;
    }

    // 2. Compute HMAC-SHA256 signature
    const payload = timestamp + token;
    const computedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(payload)
      .digest('hex');

    // 3. Compare signatures (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      console.error('[Mailgun Webhook] Signature mismatch:', {
        expected: computedSignature,
        received: signature,
      });
    }

    return isValid;
  } catch (error) {
    console.error('[Mailgun Webhook] Signature verification error:', error);
    return false;
  }
}
```

#### 4.3. Actualizar EmailEventFactory (si necesario)

**Archivo**: `infrastructure/events/EmailEventFactory.ts`

Agregar mapeo para eventos de Mailgun que no existen en Resend:

```typescript
export class EmailEventFactory {
  static createHandlers(repository: IEmailEventRepository): Map<string, IEmailEvent> {
    const handlers = new Map<string, IEmailEvent>();

    // Existing Resend events
    handlers.set('email.sent', new EmailSentEvent(repository));
    handlers.set('email.delivered', new EmailDeliveredEvent(repository));
    handlers.set('email.opened', new EmailOpenedEvent(repository));
    handlers.set('email.clicked', new EmailClickedEvent(repository));
    handlers.set('email.bounced', new EmailBouncedEvent(repository));
    handlers.set('email.delivery_delayed', new EmailDelayedEvent(repository));

    // Mailgun-specific events (optional)
    handlers.set('email.spam_complaint', new EmailSpamComplaintEvent(repository));
    handlers.set('email.unsubscribed', new EmailUnsubscribedEvent(repository));

    return handlers;
  }
}
```

---

### Fase 5: Testing (1-2h)

#### 5.1. Unit Tests para MailgunEmailProvider

**Archivo**: `infrastructure/email/__tests__/MailgunEmailProvider.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailgunEmailProvider } from '../MailgunEmailProvider';

describe('MailgunEmailProvider', () => {
  let provider: MailgunEmailProvider;
  let mockMailgun: any;

  beforeEach(() => {
    // Mock Mailgun client
    mockMailgun = {
      messages: {
        create: vi.fn(),
      },
    };

    provider = new MailgunEmailProvider(
      'test-api-key',
      'test-domain.mailgun.org'
    );
  });

  it('should send email with basic params', async () => {
    mockMailgun.messages.create.mockResolvedValue({
      id: '<message-id@test.mailgun.org>',
    });

    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Hello World</p>',
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe('<message-id@test.mailgun.org>');
  });

  it('should convert tags from Resend format to Mailgun format', async () => {
    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      tags: [
        { name: 'campaign_id', value: 'abc123' },
        { name: 'user_id', value: '456' },
      ],
    });

    expect(mockMailgun.messages.create).toHaveBeenCalledWith(
      'test-domain.mailgun.org',
      expect.objectContaining({
        'o:tag': ['campaign_id:abc123', 'user_id:456'],
      })
    );
  });

  it('should include List-Unsubscribe headers', async () => {
    await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      unsubscribeUrl: 'https://example.com/unsubscribe?token=abc',
    });

    expect(mockMailgun.messages.create).toHaveBeenCalledWith(
      'test-domain.mailgun.org',
      expect.objectContaining({
        'h:List-Unsubscribe': '<https://example.com/unsubscribe?token=abc>',
        'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    mockMailgun.messages.create.mockRejectedValue(
      new Error('Mailgun API error')
    );

    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Mailgun API error');
  });
});
```

#### 5.2. Integration Test con Sandbox

**Archivo**: `scripts/test-mailgun-integration.ts`

```typescript
import { MailgunEmailProvider } from '@/infrastructure/email/MailgunEmailProvider';
import { env } from '@/lib/env';

async function testMailgunIntegration() {
  console.log('🧪 Testing Mailgun integration...\n');

  const provider = new MailgunEmailProvider(
    env.MAILGUN_API_KEY!,
    env.MAILGUN_DOMAIN!,
    env.MAILGUN_API_URL
  );

  // Test 1: Simple email
  console.log('Test 1: Sending simple email...');
  const result1 = await provider.send({
    to: 'info@thebackstage.app',
    subject: 'Test Email from Mailgun',
    html: '<h1>Hello from Mailgun!</h1><p>This is a test email.</p>',
  });
  console.log('Result:', result1);

  // Test 2: Email with tags
  console.log('\nTest 2: Email with tags...');
  const result2 = await provider.send({
    to: 'info@thebackstage.app',
    subject: 'Test Email with Tags',
    html: '<p>This email has tags for tracking.</p>',
    tags: [
      { name: 'campaign_id', value: 'test-campaign' },
      { name: 'environment', value: 'sandbox' },
    ],
  });
  console.log('Result:', result2);

  // Test 3: Email with List-Unsubscribe
  console.log('\nTest 3: Email with List-Unsubscribe...');
  const result3 = await provider.send({
    to: 'info@thebackstage.app',
    subject: 'Test Email with Unsubscribe',
    html: '<p>This email has unsubscribe header.</p>',
    unsubscribeUrl: 'https://thebackstage.app/unsubscribe?token=test-token',
  });
  console.log('Result:', result3);

  console.log('\n✅ All tests completed!');
}

testMailgunIntegration().catch(console.error);
```

**Ejecutar:**
```bash
tsx scripts/test-mailgun-integration.ts
```

#### 5.3. Test Webhook Signature Verification

**Archivo**: `lib/webhooks/__tests__/verify-mailgun-signature.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { verifyMailgunWebhook } from '../verify-mailgun-signature';
import crypto from 'crypto';

describe('verifyMailgunWebhook', () => {
  const signingKey = 'test-signing-key';

  it('should verify valid signature', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const token = 'random-token-123';

    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');

    const isValid = verifyMailgunWebhook(timestamp, token, signature, signingKey);
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const token = 'random-token-123';
    const invalidSignature = 'invalid-signature';

    const isValid = verifyMailgunWebhook(timestamp, token, invalidSignature, signingKey);
    expect(isValid).toBe(false);
  });

  it('should reject old timestamps (>15 min)', () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString(); // 16+ minutes ago
    const token = 'random-token-123';

    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(oldTimestamp + token)
      .digest('hex');

    const isValid = verifyMailgunWebhook(oldTimestamp, token, signature, signingKey);
    expect(isValid).toBe(false);
  });
});
```

---

### Fase 6: Documentación (30min)

**Archivo**: `docs/setup/MAILGUN-SETUP.md`

```markdown
# Mailgun Setup Guide

## 1. Account Setup

1. Go to https://app.mailgun.com/
2. Sign up / Log in
3. Get API credentials:
   - API Key: Settings → API Keys
   - Domain: Sending → Domains

## 2. Domain Verification

### Sandbox Domain (Testing)
- Provided automatically: `sandboxXXXXX.mailgun.org`
- Limited to 5 authorized recipients
- Add authorized recipients in dashboard

### Production Domain (Real emails)
1. Add your domain: Sending → Domains → Add New Domain
2. Configure DNS records:
   - TXT record for SPF
   - TXT record for DKIM
   - CNAME for tracking
3. Wait for verification (~24-48h)

## 3. Environment Variables

Add to `.env.local`:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your-api-key-here
MAILGUN_DOMAIN=yourdomain.com (or sandbox domain)
MAILGUN_API_URL=https://api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key-here
USE_MAILGUN=true
```

## 4. Webhook Configuration

1. Dashboard → Sending → Webhooks
2. Add webhook: `https://thebackstage.app/api/webhooks/mailgun`
3. Select events:
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Permanent Failure
   - ✅ Temporary Failure
   - ✅ Complained
4. Copy **Webhook Signing Key** to `MAILGUN_WEBHOOK_SIGNING_KEY`

## 5. Testing

### Test email sending:
```bash
tsx scripts/test-mailgun-integration.ts
```

### Test webhook:
```bash
curl -X POST https://thebackstage.app/api/webhooks/mailgun/test
```

## 6. Migration Checklist

- [ ] Sandbox: Test email sending
- [ ] Sandbox: Test webhook receiving
- [ ] Production domain verified
- [ ] DNS records configured
- [ ] Webhooks configured
- [ ] Production test: Send 10 emails
- [ ] Production test: Verify opens/clicks tracking
- [ ] Rollback plan: Set `USE_MAILGUN=false` if issues

## 7. Suppression Lists

Mailgun automatically maintains:
- **Bounces**: Hard bounces (permanent failures)
- **Complaints**: Spam complaints
- **Unsubscribes**: Unsubscribe requests

Access: Sending → Suppressions

### Per-DJ Suppression (Multi-tenant)

Use **tags** to separate by DJ:

```typescript
tags: [{ name: 'user_id', value: '123' }]
```

Then filter suppressions by tag in dashboard.

## 8. Monitoring

- Dashboard → Analytics: Opens, clicks, deliveries
- Dashboard → Logs: Last 2 days of email logs
- Webhooks: Real-time events to your app

## 9. Troubleshooting

### Email not sent:
- Check API key is correct
- Verify domain is verified
- Check authorized recipients (sandbox)

### Webhook not received:
- Verify webhook URL is publicly accessible
- Check signing key is correct
- Look at webhook logs in dashboard

### Emails going to spam:
- Complete domain verification (SPF, DKIM, DMARC)
- Warm up sending (gradual increase)
- Monitor bounce/complaint rates
```

---

## 🚀 Orden de ejecución

### Desarrollo Local (Sandbox)

1. **Setup inicial** (30min):
   ```bash
   # 1. Instalar dependencias
   npm install mailgun.js form-data
   npm install --save-dev @types/mailgun.js

   # 2. Configurar variables de entorno
   cp .env.example .env.local
   # Editar .env.local con credenciales de Mailgun sandbox
   ```

2. **Implementar MailgunEmailProvider** (2h):
   - Crear `infrastructure/email/MailgunEmailProvider.ts`
   - Seguir implementación de Fase 2

3. **Actualizar DI Container** (30min):
   - Modificar `lib/di-container.ts`
   - Agregar feature flag `USE_MAILGUN`

4. **Testing básico** (1h):
   - Crear `scripts/test-mailgun-integration.ts`
   - Ejecutar: `tsx scripts/test-mailgun-integration.ts`
   - Verificar email recibido en inbox

5. **Implementar webhooks** (2h):
   - Crear `app/api/webhooks/mailgun/route.ts`
   - Crear `lib/webhooks/verify-mailgun-signature.ts`
   - Configurar webhook en dashboard de Mailgun
   - Usar https://webhook.site para testing inicial

6. **Testing webhooks** (1h):
   - Enviar email de prueba
   - Verificar eventos recibidos en endpoint
   - Comprobar que se guardan en `email_events` table

### Producción

7. **Verificar dominio** (24-48h):
   - Agregar dominio real en Mailgun
   - Configurar DNS records (SPF, DKIM)
   - Esperar verificación

8. **Deploy staging** (30min):
   - Deploy a Vercel preview
   - Configurar variables de entorno en Vercel
   - Testing con dominio verificado

9. **Testing producción** (1h):
   - Enviar emails reales a 10-20 contactos
   - Verificar deliverability
   - Monitorear webhooks

10. **Migración gradual** (ongoing):
    - Día 1-3: 10% tráfico a Mailgun (`USE_MAILGUN=true` para algunos users)
    - Día 4-7: 50% tráfico
    - Día 8+: 100% tráfico
    - Monitorear métricas: bounce rate, complaint rate, open rate

---

## 📊 Checklist de validación

### Pre-deployment
- [ ] Unit tests pasando para `MailgunEmailProvider`
- [ ] Integration test con sandbox exitoso
- [ ] Webhook signature verification funcionando
- [ ] Feature flag `USE_MAILGUN` implementado
- [ ] Documentación completada
- [ ] Rollback plan definido

### Post-deployment (Staging)
- [ ] Email enviado correctamente desde staging
- [ ] Webhook recibido y procesado
- [ ] Events guardados en `email_events` table
- [ ] Tags correctamente mapeados
- [ ] List-Unsubscribe header presente
- [ ] Logs sin errores

### Post-deployment (Production)
- [ ] Dominio verificado en Mailgun
- [ ] DNS records configurados (SPF, DKIM, DMARC)
- [ ] Emails entregados a inbox (no spam)
- [ ] Webhooks funcionando correctamente
- [ ] Analytics visibles en dashboard
- [ ] Suppression lists activas
- [ ] Rate limits adecuados

---

## 🎯 Métricas de éxito

**KPIs a monitorear:**
- **Delivery rate**: >98% (target)
- **Bounce rate**: <2% (hard bounces)
- **Complaint rate**: <0.1% (spam complaints)
- **Open rate**: Baseline actual (comparar con Resend)
- **Click rate**: Baseline actual
- **Webhook latency**: <1s (desde email send hasta event received)

**Herramientas:**
- Mailgun Dashboard: Analytics, Logs
- PostgreSQL: `email_events` table queries
- Sentry: Error monitoring

---

## 🔄 Rollback Plan

Si algo falla en producción:

1. **Inmediato** (< 5 min):
   ```bash
   # Set feature flag to false
   vercel env rm USE_MAILGUN production
   vercel env add USE_MAILGUN production
   # Enter: false

   # Redeploy
   vercel --prod
   ```

2. **Investigar causa**:
   - Revisar logs de Mailgun
   - Revisar Sentry errors
   - Revisar PostgreSQL `email_events`

3. **Fix y redeploy**:
   - Corregir issue
   - Testing en staging
   - Redeploy con `USE_MAILGUN=true`

---

## 📚 Referencias

- [Mailgun API Documentation](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun)
- [Mailgun Webhooks Guide](https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks)
- [Mailgun Best Practices](https://www.mailgun.com/blog/product/a-guide-to-using-mailguns-webhooks/)
- [SMTP DKIM/SPF Setup](https://documentation.mailgun.com/docs/mailgun/user-manual/events/)

---

## ✅ Conclusión

**Estimación total**: 6-8 horas de desarrollo + 24-48h de verificación DNS

**Riesgo**: **Bajo**
- Arquitectura Clean permite swap sin afectar use cases
- Feature flag permite rollback instantáneo
- Sandbox permite testing exhaustivo antes de producción

**Beneficios esperados:**
- ✅ Suppression lists multi-tenant built-in
- ✅ Webhooks más robustos
- ✅ Email validation API
- ✅ Analytics detallados
- ✅ Mejor deliverability (DKIM/SPF automático)

**Next steps:**
1. Aprobar plan
2. Ejecutar Fase 1-6 en orden
3. Testing exhaustivo en sandbox
4. Deploy a producción con feature flag
5. Migración gradual monitoreando métricas
