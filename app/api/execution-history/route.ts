import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Obtener tracks procesados con sus logs de ejecución
    const result = await sql`
      SELECT
        st.track_id,
        st.title,
        st.url,
        st.published_at,
        st.created_at,
        el.emails_sent,
        el.duration_ms,
        el.created_at as execution_time
      FROM soundcloud_tracks st
      LEFT JOIN execution_logs el ON el.created_at >= st.created_at
      WHERE el.new_tracks = 1
      ORDER BY st.created_at DESC
      LIMIT 20
    `;

    // Obtener información adicional del RSS para imágenes y descripciones
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${process.env.SOUNDCLOUD_USER_ID}/sounds.rss`;

    let feed;
    try {
      feed = await parser.parseURL(rssUrl);
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
    }

    // Enriquecer datos con información del RSS
    const enrichedHistory = result.rows.map((row) => {
      const rssTrack = feed?.items.find(
        (item) => item.link === row.url || item.guid === row.track_id
      );

      return {
        trackId: row.track_id,
        title: row.title,
        url: row.url,
        publishedAt: row.published_at,
        executedAt: row.execution_time,
        emailsSent: row.emails_sent,
        durationMs: row.duration_ms,
        coverImage: rssTrack?.itunes?.image || rssTrack?.enclosure?.url || null,
        description: rssTrack?.contentSnippet || rssTrack?.content || null
      };
    });

    return NextResponse.json({
      history: enrichedHistory
    });

  } catch (error: any) {
    console.error('Error fetching execution history:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
