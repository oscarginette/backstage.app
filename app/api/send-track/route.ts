import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as brevo from '@getbrevo/brevo';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

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

    // 2. Obtener listas de Brevo configuradas
    const configResult = await sql`
      SELECT brevo_list_ids FROM app_config WHERE id = 1
    `;

    let listIds: number[] = [];
    if (configResult.rows.length > 0 && configResult.rows[0].brevo_list_ids) {
      listIds = JSON.parse(configResult.rows[0].brevo_list_ids);
    }

    if (listIds.length === 0) {
      return NextResponse.json(
        { error: 'No hay listas de Brevo configuradas. Por favor, configura las listas primero.' },
        { status: 400 }
      );
    }

    // 3. Enviar email via Brevo
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: process.env.SENDER_EMAIL!,
      name: 'Gee Beat'
    };

    sendSmtpEmail.messageVersions = listIds.map((listId) => ({
      to: [{
        listId: listId
      }]
    }));

    sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID);
    sendSmtpEmail.params = {
      TRACK_NAME: title,
      TRACK_URL: url,
      COVER_IMAGE: coverImage || ''
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    // 4. Guardar en DB
    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at, cover_image)
      VALUES (
        ${trackId},
        ${title},
        ${url},
        ${new Date(publishedAt)},
        ${coverImage || null}
      )
    `;

    // 5. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${listIds.length}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: title,
      listsUsed: listIds.length,
      messageId: response.body?.messageId
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
