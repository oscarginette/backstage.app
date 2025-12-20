import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    // Parsear RSS de SoundCloud para obtener todos los tracks
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${process.env.SOUNDCLOUD_USER_ID}/sounds.rss`;
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    // Intentar obtener tracks enviados desde la DB (opcional)
    let sentTrackIds = new Set<string>();

    // Solo verificar DB si hay conexión configurada
    if (process.env.POSTGRES_URL) {
      try {
        const { sql } = await import('@vercel/postgres');
        const sentTracksResult = await sql`
          SELECT track_id FROM soundcloud_tracks
        `;
        sentTrackIds = new Set(sentTracksResult.rows.map(row => row.track_id));
      } catch (dbError) {
        console.log('Database not available, showing all tracks as unsent');
      }
    }

    // Formatear todos los tracks del feed con información de si han sido enviados
    const tracks = feed.items.map(item => {
      const trackId = item.guid || item.link;
      return {
        trackId,
        title: item.title || 'Sin título',
        url: item.link || '',
        publishedAt: item.pubDate || new Date().toISOString(),
        coverImage: item.itunes?.image || item.enclosure?.url || null,
        description: item.contentSnippet || item.content || null,
        alreadySent: trackId ? sentTrackIds.has(trackId) : false
      };
    });

    return NextResponse.json({ tracks });

  } catch (error: any) {
    console.error('Error fetching SoundCloud tracks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
