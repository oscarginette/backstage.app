import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Resumen general de eventos
    const eventsSummary = await sql`
      SELECT
        event_type,
        COUNT(*) as total,
        COUNT(DISTINCT contact_id) as unique_contacts,
        COUNT(DISTINCT track_id) as unique_tracks
      FROM email_events
      GROUP BY event_type
      ORDER BY total DESC
    `;

    // 2. Últimos eventos
    const recentEvents = await sql`
      SELECT
        ee.event_type,
        ee.created_at,
        c.email,
        c.name,
        st.title as track_title,
        ee.event_data
      FROM email_events ee
      JOIN contacts c ON ee.contact_id = c.id
      LEFT JOIN soundcloud_tracks st ON ee.track_id = st.track_id
      ORDER BY ee.created_at DESC
      LIMIT 50
    `;

    // 3. Estadísticas por track
    const trackStats = await sql`
      SELECT
        st.title,
        st.track_id,
        COUNT(CASE WHEN ee.event_type = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN ee.event_type = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as opened,
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as clicked,
        COUNT(CASE WHEN ee.event_type = 'bounced' THEN 1 END) as bounced,
        COUNT(DISTINCT ee.contact_id) as unique_recipients
      FROM soundcloud_tracks st
      LEFT JOIN email_events ee ON st.track_id = ee.track_id
      GROUP BY st.title, st.track_id
      ORDER BY st.published_at DESC
    `;

    // 4. Engagement por contacto (top 10)
    const topEngagedContacts = await sql`
      SELECT
        c.email,
        c.name,
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as opens,
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as clicks,
        MAX(ee.created_at) as last_interaction
      FROM contacts c
      JOIN email_events ee ON c.id = ee.contact_id
      WHERE ee.event_type IN ('opened', 'clicked')
      GROUP BY c.email, c.name
      ORDER BY (
        COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) * 2 +
        COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END)
      ) DESC
      LIMIT 10
    `;

    // 5. Tasas de conversión
    const conversionRates = await sql`
      WITH stats AS (
        SELECT
          COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as total_sent,
          COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as total_delivered,
          COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as total_opened,
          COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as total_clicked,
          COUNT(CASE WHEN event_type = 'bounced' THEN 1 END) as total_bounced
        FROM email_events
      )
      SELECT
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_bounced,
        CASE
          WHEN total_sent > 0
          THEN ROUND((total_delivered::numeric / total_sent::numeric) * 100, 2)
          ELSE 0
        END as delivery_rate,
        CASE
          WHEN total_delivered > 0
          THEN ROUND((total_opened::numeric / total_delivered::numeric) * 100, 2)
          ELSE 0
        END as open_rate,
        CASE
          WHEN total_opened > 0
          THEN ROUND((total_clicked::numeric / total_opened::numeric) * 100, 2)
          ELSE 0
        END as click_rate
      FROM stats
    `;

    return NextResponse.json({
      summary: eventsSummary.rows,
      recentEvents: recentEvents.rows,
      trackStats: trackStats.rows,
      topEngagedContacts: topEngagedContacts.rows,
      conversionRates: conversionRates.rows[0] || {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0
      }
    });

  } catch (error: any) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
