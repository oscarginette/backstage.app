/**
 * Execution History API Route
 *
 * Public endpoint to fetch execution history of email campaigns.
 * Returns recent track sends with stats.
 *
 * Clean Architecture: API route orchestrates, business logic in use case.
 */

import { NextResponse } from 'next/server';
import { UseCaseFactory } from '@/lib/di-container';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/execution-history
 *
 * Fetch recent execution history
 *
 * Response:
 * {
 *   history: ExecutionHistoryItem[]
 * }
 */
export async function GET() {
  try {
    // Check if database is configured
    if (!env.POSTGRES_URL) {
      console.log('No POSTGRES_URL configured, returning empty history');
      return NextResponse.json({
        history: [],
      });
    }

    const useCase = UseCaseFactory.createGetExecutionHistoryUseCase();
    const result = await useCase.execute();

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error fetching execution history:', error);
    // Return empty history on error to avoid breaking UI
    return NextResponse.json({
      history: [],
    });
  }
}
