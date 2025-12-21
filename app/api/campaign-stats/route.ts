import { NextResponse } from 'next/server';
import { GetCampaignStatsUseCase } from '@/domain/services/GetCampaignStatsUseCase';
import { emailAnalyticsRepository } from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaign-stats
 * Obtiene estadísticas de todas las campañas basadas en email_events
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('track_id') || undefined;

    const useCase = new GetCampaignStatsUseCase(emailAnalyticsRepository);
    const result = await useCase.execute(trackId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching campaign stats:', error);

    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        stats: [],
        message: 'Run migration first: /api/migrate'
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
