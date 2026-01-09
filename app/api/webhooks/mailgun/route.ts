/**
 * Mailgun Webhook Endpoint
 *
 * Receives email events from Mailgun and processes them.
 *
 * Events handled:
 * - delivered: Email successfully delivered
 * - opened: Email opened by recipient
 * - clicked: Link clicked in email
 * - failed: Delivery failed (permanent/temporary)
 * - complained: Spam complaint
 * - unsubscribed: User unsubscribed
 *
 * Setup in Mailgun Dashboard:
 * 1. Settings → Webhooks
 * 2. Add webhook: https://thebackstage.app/api/webhooks/mailgun
 * 3. Select events: delivered, opened, clicked, failed, complained
 * 4. Copy signing key to MAILGUN_WEBHOOK_SIGNING_KEY
 *
 * Security:
 * - Verifies HMAC-SHA256 signature to prevent malicious webhooks
 * - Validates timestamp to prevent replay attacks (max 15 minutes)
 */

import { NextResponse } from 'next/server';
import { verifyMailgunWebhook } from '@/lib/webhooks/verify-mailgun-signature';
import { ProcessEmailEventUseCase } from '@/domain/services/ProcessEmailEventUseCase';
import { EmailEventFactory } from '@/infrastructure/events/EmailEventFactory';
import { emailEventRepository } from '@/infrastructure/database/repositories';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. SECURITY: Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-mailgun-signature');
    const timestamp = request.headers.get('x-mailgun-timestamp');
    const token = request.headers.get('x-mailgun-token');

    // 2. Verify webhook signature (if signing key configured)
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

      console.log('[Mailgun Webhook] Signature verified successfully');
    } else {
      console.warn('[Mailgun Webhook] MAILGUN_WEBHOOK_SIGNING_KEY not configured - skipping verification (NOT RECOMMENDED for production)');
    }

    // 3. Parse webhook payload
    const body = JSON.parse(rawBody);
    const eventData = body['event-data'];

    if (!eventData) {
      console.error('[Mailgun Webhook] Missing event-data in payload');
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
      recipient: mappedEvent.data.recipient,
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

    console.error('[Mailgun Webhook] Error:', errorMessage, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Map Mailgun event format to internal format (compatible with Resend)
 *
 * Converts Mailgun webhook payload to match our internal event structure.
 */
function mapMailgunEvent(eventData: any): { type: string; data: any } {
  const event = eventData.event; // e.g., 'delivered', 'opened', 'clicked', 'failed'
  const messageId = eventData.message?.headers?.['message-id'];

  // Extract tags from Mailgun format and convert to Resend format
  // Mailgun: ['campaign_id:abc123', 'user_id:456']
  // Internal: [{ name: 'campaign_id', value: 'abc123' }]
  const tags = eventData.tags?.map((tag: string) => {
    const [name, ...valueParts] = tag.split(':');
    const value = valueParts.join(':'); // Handle tags with colons in value
    return { name, value };
  }) || [];

  // Map Mailgun event names to internal event names
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

  const mappedType = typeMap[event] || event;

  return {
    type: mappedType,
    data: {
      email_id: messageId,
      timestamp: eventData.timestamp,
      recipient: eventData.recipient,
      tags,
      // Bounce-specific data
      ...(event === 'failed' && {
        bounce_type: eventData.severity, // 'permanent' or 'temporary'
        reason: eventData.reason || eventData['delivery-status']?.message,
      }),
      // Click-specific data
      ...(event === 'clicked' && {
        link: eventData.url,
      }),
      // Spam complaint data
      ...(event === 'complained' && {
        complaint_type: 'spam',
      }),
    },
  };
}

/**
 * GET endpoint to verify webhook is active
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/mailgun',
    provider: 'mailgun',
    events: [
      'accepted',
      'delivered',
      'opened',
      'clicked',
      'failed (permanent)',
      'failed (temporary)',
      'complained',
      'unsubscribed',
    ],
  });
}
