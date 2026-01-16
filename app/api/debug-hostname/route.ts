import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const headers = Object.fromEntries(request.headers.entries());

  return NextResponse.json({
    hostname,
    url: request.url,
    nextUrl: {
      hostname: request.nextUrl.hostname,
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
    },
    headers: {
      host: headers['host'],
      'x-forwarded-host': headers['x-forwarded-host'],
      'x-vercel-deployment-url': headers['x-vercel-deployment-url'],
    },
  });
}
