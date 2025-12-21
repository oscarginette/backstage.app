import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaign-stats
 * Obtiene estadísticas de todas las campañas (emails por track)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('track_id');

    let stats;

    if (trackId) {
      // Estadísticas de un track específico
      stats = await sql`
        SELECT * FROM campaign_stats
        WHERE track_id = ${trackId}
      `;
    } else {
      // Estadísticas de todos los tracks
      stats = await sql`
        SELECT * FROM campaign_stats
        ORDER BY last_sent_at DESC
        LIMIT 50
      `;
    }

    return NextResponse.json({
      stats: stats.rows
    });

  } catch (error: any) {
    console.error('Error fetching campaign stats:', error);

    // Si la vista no existe (migración no ejecutada), devolver datos vacíos
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        stats: [],
        message: 'Run migration-email-tracking.sql first'
      });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
