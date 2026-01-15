import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    // 1. Check environment variables
    const authSecret = process.env.AUTH_SECRET;
    const nextauthUrl = process.env.NEXTAUTH_URL;
    const nextauthSecret = process.env.NEXTAUTH_SECRET;

    // 2. Get session using auth()
    const session = await auth();

    // 3. Get all cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionTokenCookie = cookies.find(c =>
      c.startsWith('authjs.session-token=') ||
      c.startsWith('__Secure-authjs.session-token=')
    );

    // 4. Manual JWT decode attempt
    let manualDecodeError = null;
    let manualDecodeSuccess = false;
    let decodedToken = null;
    if (sessionTokenCookie && authSecret) {
      try {
        const cookieValue = sessionTokenCookie.split('=')[1];
        const secret = new TextEncoder().encode(authSecret);
        const { payload } = await jose.jwtVerify(cookieValue, secret);
        manualDecodeSuccess = true;
        decodedToken = payload;
      } catch (error: any) {
        manualDecodeError = error.message;
      }
    }

    return NextResponse.json({
      environment: {
        hasAuthSecret: !!authSecret,
        authSecretLength: authSecret?.length,
        authSecretFirst10: authSecret?.substring(0, 10),
        authSecretLast10: authSecret?.substring(authSecret.length - 10),
        authSecretCharCodes: authSecret ? Array.from(authSecret).slice(-5).map(c => c.charCodeAt(0)) : [],
        authSecretEndsWithNewline: authSecret ? authSecret.endsWith('\n') : false,
        hasNextauthUrl: !!nextauthUrl,
        nextauthUrl: nextauthUrl,
        hasNextauthSecret: !!nextauthSecret,
        nodeEnv: process.env.NODE_ENV,
      },
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        } : null,
      },
      cookies: {
        all: cookies,
        hasSessionToken: !!sessionTokenCookie,
        sessionTokenCookie: sessionTokenCookie?.substring(0, 100) + '...',
      },
      manualJwtVerification: {
        attempted: !!sessionTokenCookie,
        success: manualDecodeSuccess,
        error: manualDecodeError,
        decodedToken: decodedToken,
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  }
}
