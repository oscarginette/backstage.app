import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { trackId, title, url, coverImage, publishedAt } = body;

    if (!trackId || !title || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: trackId, title, url' },
        { status: 400 }
      );
    }

    // 1. Verificar si ya existe en DB
    const existing = await sql`
      SELECT * FROM soundcloud_tracks WHERE track_id = ${trackId}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este track ya ha sido enviado anteriormente' },
        { status: 400 }
      );
    }

    // 2. Obtener contactos suscritos
    const contacts = await sql`
      SELECT id, email, name, unsubscribe_token
      FROM contacts
      WHERE subscribed = true
      ORDER BY created_at DESC
    `;

    if (contacts.rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay contactos suscritos' },
        { status: 400 }
      );
    }

    console.log(`Enviando emails a ${contacts.rows.length} contactos...`);

    // 3. Preparar y enviar emails con Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soundcloud-brevo.vercel.app';
    const emailsSent = [];
    const emailsFailed = [];

    for (const contact of contacts.rows) {
      try {
        // Generar URL de unsubscribe única por contacto
        const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${contact.unsubscribe_token}`;

        // Renderizar email con React Email
        const emailHtml = await render(
          NewTrackEmail({
            trackName: title,
            trackUrl: url,
            coverImage: coverImage || '',
            unsubscribeUrl
          })
        );

        // Enviar con Resend (con tracking habilitado)
        const { data, error } = await resend.emails.send({
          from: `Gee Beat <${process.env.SENDER_EMAIL}>`,
          to: contact.email,
          subject: `🎵 New track: ${title}`,
          html: emailHtml,
          tags: [
            { name: 'category', value: 'new_track' },
            { name: 'track_id', value: trackId }
          ]
        });

        if (error) {
          console.error(`Error enviando a ${contact.email}:`, error);
          emailsFailed.push({ email: contact.email, error: error.message });

          // Log de error en DB
          await sql`
            INSERT INTO email_logs (contact_id, track_id, status, error)
            VALUES (${contact.id}, ${trackId}, 'failed', ${error.message})
          `;
        } else {
          emailsSent.push({ email: contact.email, id: data?.id });

          // Log de éxito en DB
          await sql`
            INSERT INTO email_logs (contact_id, track_id, resend_email_id, status)
            VALUES (${contact.id}, ${trackId}, ${data?.id || null}, 'sent')
          `;
        }
      } catch (emailError: any) {
        console.error(`Error procesando ${contact.email}:`, emailError);
        emailsFailed.push({ email: contact.email, error: emailError.message });
      }
    }

    // 4. Guardar track en DB
    const publishedDateStr = publishedAt
      ? new Date(publishedAt).toISOString()
      : new Date().toISOString();

    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at, cover_image)
      VALUES (
        ${trackId},
        ${title},
        ${url},
        ${publishedDateStr},
        ${coverImage || null}
      )
    `;

    // 5. Log de ejecución
    await sql`
      INSERT INTO execution_logs (
        new_tracks,
        emails_sent,
        duration_ms,
        track_id,
        track_title
      )
      VALUES (
        1,
        ${emailsSent.length},
        ${Date.now() - startTime},
        ${trackId},
        ${title}
      )
    `;

    return NextResponse.json({
      success: true,
      track: title,
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      totalContacts: contacts.rows.length,
      duration: Date.now() - startTime,
      failures: emailsFailed.length > 0 ? emailsFailed : undefined
    });

  } catch (error: any) {
    console.error('Error sending track:', error);

    // Log de error
    try {
      await sql`
        INSERT INTO execution_logs (error, duration_ms)
        VALUES (${error.message}, ${Date.now() - startTime})
      `;
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
