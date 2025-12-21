import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import { Resend } from 'resend';
import NewTrackEmail from '@/emails/new-track';

// Permitir hasta 60s de ejecución
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Parsear RSS de SoundCloud
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${process.env.SOUNDCLOUD_USER_ID}/sounds.rss`;
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ message: 'No tracks found in feed' });
    }

    const latestTrack = feed.items[0];

    // 2. Obtener track ID
    const trackId = latestTrack.guid || latestTrack.link;

    if (!trackId) {
      throw new Error('Track ID not found in RSS feed');
    }

    // 3. Obtener suscriptores activos (no desuscritos)
    const subscribersResult = await sql`
      SELECT email, name FROM subscribers WHERE unsubscribed = false
    `;

    if (subscribersResult.rows.length === 0) {
      return NextResponse.json({
        message: 'No active subscribers found'
      });
    }

    // 4. Enviar emails via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soundcloud-brevo.vercel.app';

    let emailsSent = 0;
    let emailsFailed = 0;

    // Enviar a cada suscriptor
    for (const subscriber of subscribersResult.rows) {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      try {
        const { data, error } = await resend.emails.send({
          from: 'Gee Beat <onboarding@resend.dev>',
          to: [subscriber.email],
          subject: 'Hey mate',
          react: NewTrackEmail({
            trackName: latestTrack.title || 'Sin título',
            trackUrl: latestTrack.link || '',
            coverImage: latestTrack.itunes?.image || latestTrack.enclosure?.url || '',
            unsubscribeUrl
          })
        });

        if (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          emailsFailed++;
        } else {
          console.log(`Email sent to ${subscriber.email}:`, data?.id);
          emailsSent++;
        }
      } catch (err) {
        console.error(`Error sending to ${subscriber.email}:`, err);
        emailsFailed++;
      }
    }

    // 5. Guardar en DB (o actualizar si ya existe)
    const publishedDate = latestTrack.pubDate
      ? new Date(latestTrack.pubDate).toISOString()
      : new Date().toISOString();

    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at)
      VALUES (
        ${trackId},
        ${latestTrack.title || 'Sin título'},
        ${latestTrack.link || ''},
        ${publishedDate}
      )
      ON CONFLICT (track_id) DO UPDATE
      SET title = EXCLUDED.title, url = EXCLUDED.url
    `;

    // 6. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${emailsSent}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      emailsSent,
      emailsFailed,
      totalSubscribers: subscribersResult.rows.length
    });

  } catch (error: any) {
    console.error('Error in check-soundcloud:', error);

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
