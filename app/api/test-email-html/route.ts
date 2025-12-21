import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test with sample data
    const html = await render(
      NewTrackEmail({
        trackName: 'Test Track Name',
        trackUrl: 'https://soundcloud.com/test',
        coverImage: 'https://i1.sndcdn.com/artworks-PvWznzRX9GmmRIlq-mlYTvA-t3000x3000.png',
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
        unsubscribeUrl: 'https://example.com/unsubscribe'
      })
    );

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
