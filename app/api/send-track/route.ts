import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// TODO: This route needs to be refactored to use the correct use case
// The SendTrackEmailUseCase signature has changed and this route is using it incorrectly
export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'This endpoint is temporarily disabled for refactoring' },
    { status: 503 }
  );
}
