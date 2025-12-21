import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaign-stats
 * Obtiene estadísticas de todas las campañas basadas en email_events
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('track_id');

    let stats;

    if (trackId) {
      stats = await sql`
        SELECT
          st.track_id,
          st.title as track_title,
          st.url as track_url,
          st.published_at,
          COUNT(DISTINCT el.id) as total_sent,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END) as delivered,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END) as opened,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END) as clicked,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END) as bounced,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT el.id), 0) * 100), 2
          ), 0) as delivery_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END), 0) * 100), 2
          ), 0) as open_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END), 0) * 100), 2
          ), 0) as click_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT el.id), 0) * 100), 2
          ), 0) as bounce_rate
        FROM soundcloud_tracks st
        LEFT JOIN email_logs el ON st.track_id = el.track_id
        LEFT JOIN email_events ee ON el.id = ee.email_log_id
        WHERE el.id IS NOT NULL AND st.track_id = ${trackId}
        GROUP BY st.track_id, st.title, st.url, st.published_at
      `;
    } else {
      stats = await sql`
        SELECT
          st.track_id,
          st.title as track_title,
          st.url as track_url,
          st.published_at,
          COUNT(DISTINCT el.id) as total_sent,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END) as delivered,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END) as opened,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END) as clicked,
          COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END) as bounced,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT el.id), 0) * 100), 2
          ), 0) as delivery_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT CASE WHEN ee.event_type = 'delivered' THEN el.id END), 0) * 100), 2
          ), 0) as open_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'clicked' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN el.id END), 0) * 100), 2
          ), 0) as click_rate,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN ee.event_type = 'bounced' THEN el.id END)::numeric /
            NULLIF(COUNT(DISTINCT el.id), 0) * 100), 2
          ), 0) as bounce_rate
        FROM soundcloud_tracks st
        LEFT JOIN email_logs el ON st.track_id = el.track_id
        LEFT JOIN email_events ee ON el.id = ee.email_log_id
        WHERE el.id IS NOT NULL
        GROUP BY st.track_id, st.title, st.url, st.published_at
        ORDER BY st.published_at DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({
      stats: stats.rows
    });

  } catch (error: any) {
    console.error('Error fetching campaign stats:', error);

    // Si la tabla no existe, devolver datos vacíos
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        stats: [],
        message: 'Run migration first: /api/migrate'
      });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
