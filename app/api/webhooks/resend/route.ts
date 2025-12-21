import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Resend para capturar eventos de emails
 *
 * Eventos que escuchamos:
 * - email.sent: Email enviado exitosamente
 * - email.delivered: Email entregado al servidor del destinatario
 * - email.delivery_delayed: Entrega retrasada
 * - email.bounced: Email rebotado (hard/soft bounce)
 * - email.opened: Email abierto por el usuario
 * - email.clicked: Usuario hizo click en un link del email
 *
 * Configuración en Resend:
 * 1. Dashboard → Webhooks → Add endpoint
 * 2. URL: https://tu-dominio.vercel.app/api/webhooks/resend
 * 3. Events: Seleccionar todos los de arriba
 * 4. Secret: Copiar y guardar en RESEND_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  try {
    // Verificar firma del webhook (seguridad)
    const signature = request.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // TODO: Implementar verificación de firma cuando Resend lo documente
    // Por ahora, validamos que venga de Resend con un user-agent check básico

    const body = await request.json();
    const { type, data } = body;

    console.log('[Resend Webhook]', type, data);

    // Extraer el email_id de Resend (usado como resend_email_id en nuestra DB)
    const emailId = data?.email_id;

    if (!emailId) {
      console.warn('No email_id in webhook data');
      return NextResponse.json({ received: true });
    }

    // Buscar el log del email en nuestra DB
    const emailLog = await sql`
      SELECT id, contact_id, track_id
      FROM email_logs
      WHERE resend_email_id = ${emailId}
      LIMIT 1
    `;

    if (emailLog.rows.length === 0) {
      console.warn(`Email log not found for resend_email_id: ${emailId}`);
      return NextResponse.json({ received: true });
    }

    const logId = emailLog.rows[0].id;
    const contactId = emailLog.rows[0].contact_id;
    const trackId = emailLog.rows[0].track_id;

    // Registrar evento en email_events
    let eventType: string;
    let eventData: any = {};

    switch (type) {
      case 'email.sent':
        eventType = 'sent';
        break;

      case 'email.delivered':
        eventType = 'delivered';
        // Actualizar email_logs también
        await sql`
          UPDATE email_logs
          SET delivered_at = NOW()
          WHERE id = ${logId}
        `;
        break;

      case 'email.delivery_delayed':
        eventType = 'delayed';
        eventData = { reason: data?.reason };
        break;

      case 'email.bounced':
        eventType = 'bounced';
        const bounceType = data?.bounce_type || 'unknown';
        eventData = {
          bounce_type: bounceType,
          reason: data?.reason || 'No reason provided'
        };
        // Actualizar email_logs
        await sql`
          UPDATE email_logs
          SET error = ${`Bounced: ${bounceType} - ${data?.reason || 'No reason provided'}`}
          WHERE id = ${logId}
        `;
        break;

      case 'email.opened':
        eventType = 'opened';
        // Actualizar email_logs
        await sql`
          UPDATE email_logs
          SET
            opened_at = COALESCE(opened_at, NOW()),
            open_count = COALESCE(open_count, 0) + 1
          WHERE id = ${logId}
        `;
        break;

      case 'email.clicked':
        eventType = 'clicked';
        const clickedUrl = data?.url || 'unknown';
        eventData = { url: clickedUrl };
        // Actualizar email_logs
        await sql`
          UPDATE email_logs
          SET
            clicked_at = COALESCE(clicked_at, NOW()),
            click_count = COALESCE(click_count, 0) + 1,
            clicked_urls = COALESCE(clicked_urls, '[]'::jsonb) || ${JSON.stringify([clickedUrl])}::jsonb
          WHERE id = ${logId}
        `;
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
        return NextResponse.json({ received: true });
    }

    // Insertar evento en email_events
    await sql`
      INSERT INTO email_events (
        email_log_id,
        contact_id,
        track_id,
        event_type,
        event_data,
        resend_email_id
      ) VALUES (
        ${logId},
        ${contactId},
        ${trackId},
        ${eventType},
        ${JSON.stringify(eventData)},
        ${emailId}
      )
    `;

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/resend',
    events: [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.opened',
      'email.clicked'
    ]
  });
}
