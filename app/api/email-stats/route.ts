import { NextResponse } from 'next/server';
import { GetEmailStatsUseCase } from '@/domain/services/GetEmailStatsUseCase';
import { emailAnalyticsRepository } from '@/infrastructure/database/repositories';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const useCase = new GetEmailStatsUseCase(emailAnalyticsRepository);
    const result = await useCase.execute();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
